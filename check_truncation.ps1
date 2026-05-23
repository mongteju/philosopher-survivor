# check_truncation.ps1
$logPath = "C:\Users\user\.gemini\antigravity-ide\brain\af9fb412-e523-443b-8979-3ed08a6988a7\.system_generated\logs\transcript.jsonl"
$lines = Get-Content -Path $logPath -Encoding utf8

foreach ($line in $lines) {
    if ($line -like '*"step_index":2960,*' -and $line -like '*"name":"write_to_file"*') {
        Write-Host "Found step 2960!"
        if ($line -like "*<truncated>*") {
            Write-Host "Ah, it is truncated!"
            # Find the position of "<truncated>"
            $idx = $line.IndexOf("<truncated>")
            Write-Host "Truncation index: $idx"
        } else {
            Write-Host "Wow! It is NOT truncated!"
            Write-Host "Line length: $($line.Length)"
        }
        break
    }
}
