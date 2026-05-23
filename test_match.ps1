# test_match.ps1
$logPath = "C:\Users\user\.gemini\antigravity-ide\brain\af9fb412-e523-443b-8979-3ed08a6988a7\.system_generated\logs\transcript.jsonl"
$lines = Get-Content -Path $logPath -Encoding utf8

# Find step 2025
$stepLine = $null
foreach ($l in $lines) {
    if ($l -like '*"step_index":2025,*') {
        $stepLine = $l
        break
    }
}

if ($null -eq $stepLine) {
    Write-Host "Step 2025 not found in log!"
    exit
}

$data = $stepLine | ConvertFrom-Json
$tc = $data.tool_calls[0]
$args = $tc.args
if ($args -is [string]) {
    $args = $args | ConvertFrom-Json
}

$targetContent = $args.TargetContent
Write-Host "Raw targetContent length: $($targetContent.Length)"
Write-Host "Raw targetContent: '$targetContent'"

# Test JSON Obj wrap Clean-String
$jsonObjStr = "{ `"v`": $targetContent }"
$parsed = $null
try {
    $parsed = $jsonObjStr | ConvertFrom-Json
} catch {
    Write-Host "Failed to parse json wrap: $_"
}

if ($null -ne $parsed) {
    $cleaned = $parsed.v
} else {
    $cleaned = $targetContent
}

Write-Host "Cleaned length: $($cleaned.Length)"
Write-Host "Cleaned: '$cleaned'"

$localPath = "c:\Users\user\.gemini\antigravity-ide\scratch\philosopher-survivor\game.js"
$fileContent = [System.IO.File]::ReadAllText($localPath, [System.Text.Encoding]::UTF8)

# Normalize both
function Normalize($str) {
    return $str -replace "`r`n", "`n"
}

$normFile = Normalize $fileContent
$normCleaned = Normalize $cleaned

$contains = $normFile.Contains($normCleaned)
Write-Host "Contains? $contains"

if (-not $contains) {
    # Let's search for a small portion of it
    $sub = "ctx.textAlign = 'center';"
    $idx = $normFile.IndexOf($sub)
    if ($idx -ge 0) {
        Write-Host "Found sub at index $idx"
        $snippet = $normFile.Substring($idx, [Math]::Min(200, $normFile.Length - $idx))
        Write-Host "File snippet around there: "
        Write-Host "===================="
        Write-Host $snippet
        Write-Host "===================="
    } else {
        Write-Host "Could not even find the sub string in game.js!"
    }
}
