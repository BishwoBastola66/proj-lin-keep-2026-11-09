import { Router } from 'express';
import { supabase } from '../db';

const router = Router();

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('crm_tasks')
      .select(`
        *,
        srimatric (facility_name),
        crm_users (name)
      `)
      .order('due_date', { ascending: true });
      
    if (error) throw error;
    
    // Transform data to match previous flat structure
    const formattedData = data?.map((task: any) => ({
      ...task,
      facility_name: task.srimatric?.facility_name || 'Unknown Facility',
      assigned_user_name: task.crm_users?.name || 'Unassigned'
    })) || [];
    
    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Server error fetching tasks' });
  }
});

// Toggle task completion
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_completed } = req.body;
    
    const { data, error } = await supabase
      .from('crm_tasks')
      .update({ is_completed })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error toggling task:', error);
    res.status(500).json({ error: 'Server error updating task' });
  }
});

export default router;
