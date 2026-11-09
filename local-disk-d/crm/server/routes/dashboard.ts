import { Router } from 'express';
import { supabase } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { count: totalFacilitiesCount, error: totalError } = await supabase
      .from('srimatric')
      .select('*', { count: 'exact', head: true });

    const { count: highPriorityCount, error: priorityError } = await supabase
      .from('srimatric')
      .select('*', { count: 'exact', head: true })
      .eq('is_priority_region', true);

    if (totalError || priorityError) {
      throw totalError || priorityError;
    }
    
    const { data: pipelineData, error: pipelineError } = await supabase
      .from('srimatric')
      .select('id, first_name, last_name, pipeline_stage, city, county, is_priority_region');
      
    if (pipelineError) throw pipelineError;
    
    res.json({
      counters: {
        totalFacilities: totalFacilitiesCount || 0,
        highPriority: highPriorityCount || 0,
      },
      facilities: pipelineData
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Server error fetching dashboard data' });
  }
});

export default router;
