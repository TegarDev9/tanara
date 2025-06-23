import { NextRequest, NextResponse } from 'next/server';

// Helper function to verify TON signature (simplified for example, might need more robust implementation)
// In a real application, this would involve cryptographic verification using a TON library.
async function verifyTonSignature(): Promise<boolean> {
  // IMPORTANT: This is a temporary bypass for demonstration purposes.
  // In a real application, you MUST implement proper cryptographic verification
  // of the TON signature using a TON library (e.g., @ton/crypto or similar).
  // This placeholder always returns true, making the login insecure.
  console.warn('WARNING: TON signature verification is bypassed. This is NOT secure for production.');
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Clone the request to ensure the body stream can be read safely,
    // especially if other middlewares or parts of the application might also try to read it.
    const clonedReq = req.clone();
    const { tonAddress, signature, message } = await clonedReq.json();

    if (!tonAddress || !signature || !message) {
      return NextResponse.json({ error: 'Missing tonAddress, signature, or message' }, { status: 400 });
    }

    // Verify TON signature (temporarily bypassed)
    const isSignatureValid = await verifyTonSignature();

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

  } catch (error: unknown) {
    console.error('Error in TON login API:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
