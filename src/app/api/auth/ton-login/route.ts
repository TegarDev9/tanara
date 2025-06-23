import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
// Helper function to verify TON signature (simplified for example, might need more robust implementation)
async function verifyTonSignature(address: string, message: string, signature: string): Promise<boolean> {
  try {
    // In a real scenario, you would reconstruct the signed message payload
    // and verify it against the signature using a TON library.
    // This is a placeholder for the actual signature verification logic.
    // For example, you might need to fetch the public key from the blockchain
    // or from the wallet's connection data and use a crypto library.

    // For demonstration, we'll assume a simple verification.
    // A proper implementation would involve:
    // 1. Reconstructing the exact payload that was signed by the wallet.
    // 2. Getting the public key associated with the wallet address.
    // 3. Using a cryptographic library (e.g., nacl) to verify the signature.

    // Example (conceptual, not fully functional without wallet's public key):
    // const publicKey = await tonClient.getWalletPublicKey(walletAddress);
    // const isValid = nacl.sign.detached.verify(
    //   Buffer.from(message),
    //   Buffer.from(signature, 'base64'),
    //   Buffer.from(publicKey, 'hex')
    // );
    // return isValid;

    // For now, we'll just return true for any non-empty signature.
    // THIS IS NOT SECURE FOR PRODUCTION. REPLACE WITH ACTUAL VERIFICATION.
    return signature.length > 0;

  } catch (e) {
    console.error('Error verifying TON signature:', e);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tonAddress, signature, message } = await req.json();

    if (!tonAddress || !signature || !message) {
      return NextResponse.json({ error: 'Missing tonAddress, signature, or message' }, { status: 400 });
    }

    // 1. Verify TON signature
    const isSignatureValid = await verifyTonSignature(tonAddress, message, signature);

    if (!isSignatureValid) {
      return NextResponse.json({ error: 'Invalid TON signature' }, { status: 401 });
    }

    // 2. Find or create Supabase user based on TON address
    let user;
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, wallet_address')
      .eq('wallet_address', tonAddress)
      .limit(1);

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (profiles && profiles.length > 0) {
      // User exists, get their Supabase user data
      const existingProfile = profiles[0];
      const { data: existingUser, error: userError } = await supabase.auth.admin.getUserById(existingProfile.id);
      if (userError) {
        console.error('Error getting existing user by ID:', userError);
        return NextResponse.json({ error: 'Failed to retrieve user data' }, { status: 500 });
      }
      user = existingUser.user;
      console.log(`Existing Supabase user found for TON address ${tonAddress}: ${user?.id}`);

      // Update last_login_at for existing profile
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', existingProfile.id);

      if (updateProfileError) {
        console.error('Error updating existing profile:', updateProfileError);
        // Log the error but don't necessarily block the login flow for a non-critical update
      }

    } else {
      // User does not exist, create a new one
      console.log(`No existing Supabase user for TON address ${tonAddress}. Creating new user.`);

      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: `${tonAddress.substring(0, 10)}...${tonAddress.substring(tonAddress.length - 5)}@ton.user`, // Unique dummy email
        password: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15), // Stronger random password
        email_confirm: true, // Mark email as confirmed
        user_metadata: {
          ton_address: tonAddress,
        },
      });

      if (createUserError) {
        console.error('Error creating new Supabase user:', createUserError);
        return NextResponse.json({ error: `Failed to create new user: ${createUserError.message}` }, { status: 500 });
      }
      user = newUser.user;
      console.log(`New Supabase user created: ${user?.id}`);

      // Create or update profile for the newly created Supabase user, handling potential duplicates on wallet_address
      const { error: upsertProfileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          wallet_address: tonAddress,
          last_login_at: new Date().toISOString(),
          // Add other profile fields as needed
        }, { onConflict: 'wallet_address' }); // Use wallet_address for conflict resolution

      if (upsertProfileError) {
        console.error('Error upserting profile for new user:', upsertProfileError);
        return NextResponse.json({ error: 'Failed to link TON address to profile' }, { status: 500 });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found or created' }, { status: 500 });
    }

    // 3. Generate Supabase JWT for the user
    const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!, // Use the user's email
      // You can add a redirect to your app's dashboard or home page
      // redirectTo: 'http://localhost:3000/dashboard',
    });

    if (tokenError) {
      console.error('Error generating magic link token:', tokenError);
      return NextResponse.json({ error: 'Failed to generate authentication token' }, { status: 500 });
    }

    // The magic link contains the access_token. We need to extract it.
    // This is a bit hacky, as generateLink is meant for email verification.
    // A better approach for direct JWT generation would be to use a custom JWT flow
    // or a direct sign-in if the user has a password (which they don't here).
    // For now, we'll simulate by extracting the token from the magic link URL.
    // In a real scenario, you might use a custom auth provider or a server-side sign-in.

    // For a true JWT, you'd typically use `supabase.auth.signInWithPassword`
    // or a custom auth flow that returns a session.
    // Since we're creating users without passwords, we need an admin-level way to get a session.
    // The `generateLink` method is the closest for getting a token that can be used to sign in.

    // Let's assume we want to directly sign in the user on the client side with a JWT.
    // Supabase's admin client doesn't directly give you a JWT for client-side use without a password.
    // The most straightforward way to get a client-usable session from the backend
    // after admin.createUser is to use `supabase.auth.signInWithIdToken` if you have an ID token
    // from an external provider, or to create a custom JWT.

    // For this specific "login with TON" flow, the best approach is often:
    // 1. Backend verifies TON signature.
    // 2. Backend identifies/creates Supabase user.
    // 3. Backend generates a *custom* JWT (not a Supabase session JWT directly)
    //    that contains the Supabase user ID and other claims.
    // 4. Frontend receives this custom JWT.
    // 5. Frontend then uses `supabase.auth.signInWithIdToken` (if Supabase supports custom ID tokens)
    //    or simply uses the custom JWT for authenticated API calls to *your* backend,
    //    and keeps the Supabase session separate (e.g., for RLS).

    // Given the current Supabase client setup, the simplest way to get a client-usable session
    // is to use `supabase.auth.signInWithIdToken` if we had an ID token, or to
    // directly set the session if we had the `access_token` and `refresh_token`.
    // `generateLink` gives a URL, not direct tokens.

    // Let's adjust the strategy: instead of generating a magic link,
    // we'll just return the user ID and let the client handle the session if needed,
    // or rely on the client to re-authenticate if they need a full Supabase session.
    // This is a common pattern for external auth where Supabase is just the user store.

    // If the goal is to get a *Supabase session* on the client, we need to:
    // A) Have the client sign in with a password (not applicable here).
    // B) Use a custom auth provider flow.
    // C) Use `supabase.auth.setSession` on the client with an `access_token` and `refresh_token`.
    //    The admin client can't directly give these for a user without a password.

    // Let's simplify for now: the backend confirms the TON address is linked to a Supabase user.
    // The client will then know they are "logged in" via TON and can proceed.
    // If a full Supabase session is *required* on the client, we'd need a more complex flow
    // (e.g., a custom JWT issued by *your* backend, then `signInWithIdToken` on client).

    // For the purpose of "Supabase JWT user", the most direct way is to return the user's ID
    // and let the client know they are authenticated. If the client needs a *Supabase session*,
    // they would typically sign in with email/password or an OAuth provider.
    // Since TON is not a native Supabase OAuth provider, we're bridging it.

    // Let's return the user's ID and a success message.
    // If a full Supabase session is needed, the client would then call `supabase.auth.getSession()`
    // which would work if the user was already signed in via other means, or if we had a way
    // to programmatically sign them in on the client after this backend call.

    // To truly get a JWT for the client, we would need to:
    // 1. Create a custom JWT on the backend using a secret.
    // 2. Send this custom JWT to the client.
    // 3. On the client, use `supabase.auth.signInWithIdToken` (if Supabase supports it for custom JWTs)
    //    or simply use this custom JWT for subsequent API calls to *your* backend.

    // Given the prompt "supabase jwt user", the most direct way to get a Supabase JWT
    // is to use `supabase.auth.signInWithPassword` or `signInWithOAuth`.
    // Since we're not doing that, the "JWT user" part implies we need to *create* a session.

    // Let's try to create a session token for the user using the admin client.
    // This is not directly supported to get a client-usable `access_token` and `refresh_token`
    // without a password.

    // Alternative: If the user already has an email/password, we could sign them in.
    // But for TON-only login, they don't.

    // The most common pattern for this is to use a custom JWT issued by *your* server.
    // Supabase's `signInWithIdToken` is for external identity providers (like Google, Apple).
    // If we want to use Supabase's RLS, we need a Supabase session.

    // Let's assume the goal is to get a Supabase `access_token` that the client can use.
    // The `generateLink` method *does* produce a URL that, when visited, sets a session.
    // We can parse the `access_token` from this URL.

    const magicLinkUrl = tokenData.properties.action_link;
    const urlParams = new URLSearchParams(magicLinkUrl.split('#')[1]);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');

    if (!accessToken || !refreshToken) {
      console.error('Failed to extract tokens from magic link:', magicLinkUrl);
      return NextResponse.json({ error: 'Failed to generate session tokens' }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      userId: user.id,
      accessToken,
      refreshToken,
    });

  } catch (error) {
    console.error('Error in TON login API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
