import { injectable, inject } from 'inversify';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { SYMBOLS } from '../di/symbols.js';
import { users, authenticators, sessions } from '../db/schema/auth.js';
import type { Database } from '../db/drizzle.js';

const RP_NAME = 'Command Central';
const RP_ID = process.env.WEBAUTHN_RP_ID ?? 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN ?? 'http://localhost:5173';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// In-memory challenge store (per-session). Fine for single-user.
const challengeStore = new Map<string, string>();

@injectable()
export class AuthService {
  constructor(@inject(SYMBOLS.Database) private db: Database) {}

  async hasUsers(): Promise<boolean> {
    const result = await this.db.select().from(users).limit(1);
    return result.length > 0;
  }

  async getRegistrationOptions(username: string) {
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: username,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    challengeStore.set(username, options.challenge);
    return options;
  }

  async verifyRegistration(username: string, response: RegistrationResponseJSON) {
    const expectedChallenge = challengeStore.get(username);
    if (!expectedChallenge) throw new Error('No challenge found');

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new Error('Registration verification failed');
    }

    const { credential } = verification.registrationInfo;

    // Create user
    const [user] = await this.db.insert(users).values({ username }).returning();

    // Store authenticator
    // In SimpleWebAuthn v10+, credential.id is already a Base64URLString
    await this.db.insert(authenticators).values({
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      transports: response.response.transports ? JSON.stringify(response.response.transports) : null,
      userId: user.id,
    });

    challengeStore.delete(username);

    // Create session
    return this.createSession(user.id);
  }

  async getAuthenticationOptions() {
    const allAuthenticators = await this.db.select().from(authenticators);

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: allAuthenticators.map(a => ({
        id: a.credentialId,
        transports: a.transports ? JSON.parse(a.transports) : undefined,
      })),
      userVerification: 'preferred',
    });

    challengeStore.set('__login__', options.challenge);
    return options;
  }

  async verifyAuthentication(response: AuthenticationResponseJSON) {
    const expectedChallenge = challengeStore.get('__login__');
    if (!expectedChallenge) throw new Error('No challenge found');

    const credentialId = response.id;
    const [authenticator] = await this.db
      .select()
      .from(authenticators)
      .where(eq(authenticators.credentialId, credentialId));

    if (!authenticator) throw new Error('Authenticator not found');

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: authenticator.credentialId,
        publicKey: Buffer.from(authenticator.publicKey, 'base64url'),
        counter: authenticator.counter,
      },
    });

    if (!verification.verified) {
      throw new Error('Authentication verification failed');
    }

    // Update counter
    await this.db
      .update(authenticators)
      .set({ counter: verification.authenticationInfo.newCounter })
      .where(eq(authenticators.credentialId, credentialId));

    challengeStore.delete('__login__');

    return this.createSession(authenticator.userId);
  }

  async validateSession(sessionId: string) {
    const [session] = await this.db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session) return null;
    if (new Date(session.expiresAt) < new Date()) {
      await this.db.delete(sessions).where(eq(sessions.id, sessionId));
      return null;
    }
    const [user] = await this.db.select().from(users).where(eq(users.id, session.userId));
    return user ?? null;
  }

  async deleteSession(sessionId: string) {
    await this.db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  async devLogin(username: string) {
    // Find or create user (test/dev only)
    let [user] = await this.db.select().from(users).where(eq(users.username, username));
    if (!user) {
      [user] = await this.db.insert(users).values({ username }).returning();
    }
    return this.createSession(user.id);
  }

  private async createSession(userId: string) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await this.db.insert(sessions).values({ id: sessionId, userId, expiresAt });
    return { sessionId, expiresAt };
  }
}
