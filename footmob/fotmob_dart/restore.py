import json
import os

log_path = '/home/bishwaxyz/.gemini/antigravity-ide/brain/acc644bc-9d79-49a0-8611-57d6a1824ebb/.system_generated/logs/transcript_full.jsonl'

with open(log_path, 'r') as f:
    for line in f:
        data = json.loads(line)
        if data.get('type') == 'PLANNER_RESPONSE':
            calls = data.get('tool_calls', [])
            if calls:
                for call in calls:
                    if call.get('name') == 'default_api:write_to_file' or call.get('name') == 'write_to_file':
                        args = call.get('args', call.get('arguments', {}))
                        target_file = args.get('TargetFile', '')
                        if 'lib/src/models/' in target_file and target_file.endswith('.dart') and 'models.dart' not in target_file:
                            code = args.get('CodeContent', '')
                            if "part '" in code:
                                with open(target_file, 'w') as out_f:
                                    out_f.write(code)
                                print(f'Restored {target_file}')
                            else:
                                print(f'Skipped (no part): {target_file}')
                        else:
                            print(f'Skipped (path mismatch): {target_file}')
