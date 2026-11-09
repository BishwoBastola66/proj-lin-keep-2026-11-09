import { Router } from 'express';
import { supabase } from '../db';

const router = Router();

// Get details of a specific facility including interactions
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: facilityData, error: facilityError } = await supabase
      .from('srimatric')
      .select('*')
      .eq('id', id)
      .single();
      
    if (facilityError) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    
    const { data: interactionsData, error: interactionsError } = await supabase
      .from('facility_interactions')
      .select('*')
      .eq('facility_id', id)
      .order('created_at', { ascending: false });
      
    if (interactionsError) throw interactionsError;
    
    res.json({
      facility: facilityData,
      interactions: interactionsData || []
    });
  } catch (error) {
    console.error('Error fetching facility details:', error);
    res.status(500).json({ error: 'Server error fetching facility details' });
  }
});

// Update pipeline stage
router.patch('/:id/stage', async (req, res) => {
  try {
    const { id } = req.params;
    const { pipeline_stage } = req.body;
    
    const { data, error } = await supabase
      .from('srimatric')
      .update({ pipeline_stage })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error updating facility stage:', error);
    res.status(500).json({ error: 'Server error updating facility' });
  }
});

export default router;
