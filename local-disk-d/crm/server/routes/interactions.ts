import { Router } from 'express';
import { supabase } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('facility_interactions')
      .select('*, srimatric(facility_name)')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error) throw error;
    
    const formattedData = data?.map((i: any) => ({
      ...i,
      facility_name: i.srimatric?.facility_name || 'Unknown'
    })) || [];
    
    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching interactions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
