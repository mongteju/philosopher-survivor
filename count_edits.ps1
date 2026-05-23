$logPath = "C:\Users\user\.gemini\antigravity-ide\brain\af9fb412-e523-443b-8979-3ed08a6988a7\.system_generated\logs\transcript.jsonl"
$lines = Get-Content -Path $logPath -Encoding utf8
$count = 0
$idx = 0
foreach ($line in $lines) {
    $idx++
    if ($line -like '*"replace_file_content"*' -or $line -like '*"write_to_file"*' -or $line -like '*"multi_replace_file_content"*') {
        if ($line -like '*game.js*') {
            # Find step index
            if ($line -match '"step_index":(\d+)') {
                $step = $Matches[1]
                Write-Host "Line $idx : Step $step has game.js edit"
                $count++
            }
        }
    }
}
Write-Host "Total game.js edits: $count"
