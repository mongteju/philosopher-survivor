$logPath = "C:\Users\user\.gemini\antigravity-ide\brain\af9fb412-e523-443b-8979-3ed08a6988a7\.system_generated\logs\transcript.jsonl"
$targetStep = 2025
if ($args.Count -gt 0) {
    $targetStep = [int]$args[0]
}

Write-Host "Searching step $targetStep..."
$lines = Get-Content -Path $logPath -Encoding utf8
$found = $false
foreach ($line in $lines) {
    if ($line -like "*`"step_index`":$targetStep,*") {
        Write-Host $line
        $found = $true
        break
    }
}
if (-not $found) {
    Write-Host "Step not found!"
}
