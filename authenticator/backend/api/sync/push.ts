import { supabase } from '../../utils/db';
import { verifyToken } from '../../utils/jwt';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = await verifyToken(token);
      if (!decoded) throw new Error('Invalid token');
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const userId = decoded.userId;
    const { authenticatorAccounts, vaultItems } = req.body;

    // In a real scenario, we would use Supabase RPC or upsert
    // For now, let's delete existing and insert new (simple sync)
    // NOTE: This assumes the client sends the FULL list every time.
    
    // Clear old accounts for this user
    await supabase
      .from('authenticator_accounts')
      .delete()
      .eq('user_id', userId);

    if (authenticatorAccounts && authenticatorAccounts.length > 0) {
      const accountsToInsert = authenticatorAccounts.map((acc: any) => ({
        id: acc.id,
        user_id: userId,
        issuer: acc.issuer,
        account_name: acc.accountName,
        encrypted_secret: acc.encryptedSecret,
        algorithm: acc.algorithm || 'SHA1',
        digits: acc.digits || 6,
        period: acc.period || 30,
      }));

      const { error: insertError } = await supabase
        .from('authenticator_accounts')
        .insert(accountsToInsert);

      if (insertError) throw insertError;
    }

    return res.status(200).json({
      message: 'Sync successful',
      syncedAccountsCount: authenticatorAccounts?.length || 0,
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
