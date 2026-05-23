# find_gamejs_writes.ps1
$logPath = "C:\Users\user\.gemini\antigravity-ide\brain\af9fb412-e523-443b-8979-3ed08a6988a7\.system_generated\logs\transcript.jsonl"
$lines = Get-Content -Path $logPath -Encoding utf8
foreach ($line in $lines) {
    if ($line -like '*"name":"write_to_file"*' -and $line -like '*"TargetFile":*game.js*') {
        if ($line -match '"step_index":(\d+)') {
            $step = $Matches[1]
            $tr = $line -like "*<truncated>*"
            Write-Host "Step $step wrote game.js. Truncated? $tr. Length: $($line.Length)"
        }
    }
}
