# find_views.ps1
$logPath = "C:\Users\user\.gemini\antigravity-ide\brain\fa134cf1-1e5b-4ee2-a082-30e3606292d7\.system_generated\logs\transcript.jsonl"
$lines = Get-Content -Path $logPath -Encoding utf8

$idx = 0
foreach ($line in $lines) {
    $idx++
    if ($line -like '*"name":"view_file"*' -and $line -like '*game.js*') {
        if ($line -match '"step_index":(\d+)') {
            $step = $Matches[1]
            # Try to get startLine and endLine
            $start = "none"
            $end = "none"
            if ($line -match '"StartLine":(\d+)') { $start = $Matches[1] }
            if ($line -match '"EndLine":(\d+)') { $end = $Matches[1] }
            Write-Host "Line $idx : Step $step viewed game.js lines $start to $end"
        }
    }
}
