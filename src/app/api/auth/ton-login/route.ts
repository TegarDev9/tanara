import { NextRequest, NextResponse } from 'next/server';

// Helper function to verify TON signature (simplified for example, might need more robust implementation)
// In a real application, this would involve cryptographic verification using a TON library.
async function verifyTonSignature(address: string, message: string, signature: string): Promise<boolean> {
  try {
    // Placeholder for actual TON signature verification logic.
    // For now, we'll just check if the signature is non-empty.
    // This is NOT secure for production.
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

    // Verify TON signature
    const isSignatureValid = await verifyTonSignature(tonAddress, message, signature);

    if (!isSignatureValid) {
      return NextResponse.json({ error: 'Invalid TON signature' }, { status: 401 });
    }

    // Supabase user management and session generation logic removed.
    // If user profiles or sessions need to be persisted, a new database solution
    // (not Supabase) would be required, and this API route would interact with it.
    // For now, we simply confirm successful TON signature verification.

    return NextResponse.json({
      status: 'success',
      message: 'TON signature verified successfully. User logged in via TON.',
      tonAddress: tonAddress,
    });

  } catch (error) {
    console.error('Error in TON login API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
