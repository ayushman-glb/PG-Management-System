import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { Request } from "express";
import { Container } from "../container";
import { env } from "./env";
import { Role } from "@prisma/client";

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
          const googleSubId = profile.id;
          // Prioritize verified email address per OpenID Connect best practices
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

          // Parse role from state parameter if provided
          let role: Role | undefined;
          if (req.query?.state) {
            try {
              const stateObj = JSON.parse(
                Buffer.from(req.query.state as string, "base64").toString("utf-8")
              );
              if (
                stateObj?.role &&
                (stateObj.role === "RESIDENT" || stateObj.role === "OWNER")
              ) {
                role = stateObj.role as Role;
              }
            } catch {
              try {
                const stateObj = JSON.parse(req.query.state as string);
                if (
                  stateObj?.role &&
                  (stateObj.role === "RESIDENT" || stateObj.role === "OWNER")
                ) {
                  role = stateObj.role as Role;
                }
              } catch {
                // Ignore if unparseable
              }
            }
          }

          const user = await Container.userRepository.findOrCreateGoogleUser({
            googleSubId,
            email,
            name,
            avatarUrl,
            role,
          });

          return done(null, user as Express.User);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
} else {
  // Graceful fallback for deployments without active Google OAuth client configuration
  passport.use(
    new GoogleStrategy(
      {
        clientID: "unconfigured_google_client_id.apps.googleusercontent.com",
        clientSecret: "unconfigured_google_client_secret",
        callbackURL: env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/v1/auth/google/callback",
      },
      (_accessToken: string, _refreshToken: string, _profile: Profile, done: VerifyCallback) => {
        done(new Error("Google OAuth 2.0 is not configured in server environment variables."));
      }
    )
  );
}

passport.serializeUser((user: Express.User, done: (err: any, id?: unknown) => void) => {
  done(null, (user as any).id);
});

passport.deserializeUser(async (id: string, done: (err: any, user?: Express.User | null | false) => void) => {
  try {
    const user = await Container.userRepository.findById(id);
    done(null, user as Express.User | null);
  } catch (err) {
    done(err, null);
  }
});


export default passport;
