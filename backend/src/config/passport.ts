import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { Request } from "express";
import { prisma } from "./prisma";
import { env } from "./env";
import { Role } from "@prisma/client";
import * as crypto from "crypto";

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
      },
      async (
        req: Request,
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: VerifyCallback
      ) => {
        try {
          const verifiedEmailObj =
            profile.emails?.find(
              (e) => e.verified === true || (e as any).verified === "true"
            ) || profile.emails?.[0];
          const email = verifiedEmailObj?.value;

          const name =
            profile.displayName || profile.name?.givenName || "Google User";
          const avatarUrl = profile.photos?.[0]?.value;

          if (!email) {
            return done(
              new Error("Google profile did not return a verified email address.")
            );
          }

          let user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          });

          if (!user) {
            const randomPassword = crypto.randomBytes(32).toString('hex');
            user = await prisma.user.create({
              data: {
                email: email.toLowerCase(),
                phone: `+91${Date.now().toString().slice(-10)}`,
                username: `user_${Date.now().toString().slice(-6)}`,
                passwordHash: randomPassword,
                avatarUrl,
                emailVerified: true,
                role: Role.RESIDENT,
                profile: {
                  create: {
                    firstName: name.split(' ')[0] || 'User',
                    lastName: name.split(' ').slice(1).join(' ') || '',
                  },
                },
              },
            });
          }

          return done(null, user as Express.User);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}

passport.serializeUser((user: Express.User, done: (err: any, id?: unknown) => void) => {
  done(null, (user as any).id);
});

passport.deserializeUser(async (id: string, done: (err: any, user?: Express.User | null | false) => void) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user as Express.User | null);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
