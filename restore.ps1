# restore.ps1 - Recover lost workspace changes by replaying tool edits from logs
$logPath = "C:\Users\user\.gemini\antigravity-ide\brain\af9fb412-e523-443b-8979-3ed08a6988a7\.system_generated\logs\transcript.jsonl"
$baseDir = "c:\Users\user\.gemini\antigravity-ide\scratch\philosopher-survivor"

Write-Host "Reading transcript log..."
$jsonLines = Get-Content -Path $logPath -Encoding utf8
Write-Host "Total raw lines: $($jsonLines.Count)"

# Helper function to normalize path
function Get-LocalPath($target) {
    if ($null -eq $target) { return $null }
    $t = "$target"
    if ($t -like "*game.js*") { return "$baseDir\game.js" }
    if ($t -like "*index.html*") { return "$baseDir\index.html" }
    if ($t -like "*style.css*") { return "$baseDir\style.css" }
    return $null
}

# Helper to normalize line endings to LF
function Normalize-ToLF($str) {
    if ($null -eq $str) { return "" }
    return $str -replace "`r`n", "`n"
}

# Helper to unescape JSON strings
function Clean-String($str) {
    if ($null -eq $str) { return "" }
    if ($str -isnot [string]) { return $str }
    
    $s = $str.Trim()
    
    # Wrap in a JSON object to let ConvertFrom-Json handle the unescaping properly
    $jsonObjStr = "{ `"v`": $str }"
    try {
        $parsed = $jsonObjStr | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($null -ne $parsed -and $null -ne $parsed.v) {
            return $parsed.v
        }
    } catch {}
    
    # Fallback to manual stripping if JSON parsing failed
    if ($s.StartsWith('"') -and $s.EndsWith('"') -and $s.Length -ge 2) {
        $s = $s.Substring(1, $s.Length - 2)
    }
    $s = $s.Replace('\n', "`n").Replace('\t', "`t").Replace('\"', '"').Replace('\\', '\')
    return $s
}

# Process each step in chronological order using accumulator for multi-line JSON
$stepCount = 0
$accumulator = ""
$lineIdx = 0

foreach ($line in $jsonLines) {
    $lineIdx++
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    
    $accumulator += $line + "`n"
    
    # Try parsing the accumulated text
    $data = $null
    try {
        $data = $accumulator | ConvertFrom-Json -ErrorAction SilentlyContinue
    } catch {}
    
    # If parsing failed, continue accumulating next lines
    if ($null -eq $data) {
        continue
    }
    
    # Successfully parsed! Reset accumulator
    $accumulator = ""
    
    $toolCalls = $data.tool_calls
    if ($null -eq $toolCalls) { continue }
    
    foreach ($tc in $toolCalls) {
        $name = $tc.name
        if ($null -eq $name -and $tc.function) {
            $name = $tc.function.name
        }
        
        $args = $tc.args
        if ($null -eq $args -and $tc.function) {
            $args = $tc.function.arguments
        }
        if ($null -eq $args) { continue }
        
        # If args is a string, parse it
        if ($args -is [string]) {
            try {
                $args = $args | ConvertFrom-Json
            } catch {
                Write-Warning "Step $($data.step_index): Failed to parse args string!"
                continue
            }
        }
        
        $targetFile = Clean-String $args.TargetFile
        $localPath = Get-LocalPath $targetFile
        if ($null -eq $localPath) { continue }
        
        if ($name -eq "write_to_file") {
            $content = Clean-String $args.CodeContent
            if ($null -ne $content -and $content -ne "") {
                Write-Host "Step $($data.step_index): Overwriting $localPath"
                $content = Normalize-ToLF $content
                [System.IO.File]::WriteAllText($localPath, $content, [System.Text.Encoding]::UTF8)
                $stepCount++
            }
        }
        elseif ($name -eq "replace_file_content") {
            $targetContent = Clean-String $args.TargetContent
            $replacementContent = Clean-String $args.ReplacementContent
            
            if ($targetContent -eq "" -or $null -eq $targetContent) {
                Write-Warning "Step $($data.step_index): TargetContent is empty!"
                continue
            }
            
            if ([System.IO.File]::Exists($localPath)) {
                $fileContent = Normalize-ToLF ([System.IO.File]::ReadAllText($localPath, [System.Text.Encoding]::UTF8))
                $targetContent = Normalize-ToLF $targetContent
                $replacementContent = Normalize-ToLF $replacementContent
                
                if ($fileContent.Contains($targetContent)) {
                    Write-Host "Step $($data.step_index): Replacing content in $localPath"
                    $fileContent = $fileContent.Replace($targetContent, $replacementContent)
                    [System.IO.File]::WriteAllText($localPath, $fileContent, [System.Text.Encoding]::UTF8)
                    $stepCount++
                } else {
                    Write-Warning "Step $($data.step_index): Target content not found in $localPath!"
                    $preview = $targetContent
                    if ($preview.Length -gt 80) { $preview = $preview.Substring(0, 80) + "..." }
                    Write-Warning "Searched for: '$preview'"
                }
            }
        }
        elseif ($name -eq "multi_replace_file_content") {
            $chunks = $args.ReplacementChunks
            if ($null -eq $chunks) { continue }
            
            if ($chunks -is [string]) {
                try {
                    $chunks = $chunks | ConvertFrom-Json
                } catch {
                    Write-Warning "Step $($data.step_index): Failed to parse ReplacementChunks string!"
                    continue
                }
            }
            
            if ([System.IO.File]::Exists($localPath)) {
                Write-Host "Step $($data.step_index): Multi-replacing content in $localPath ($($chunks.Count) chunks)"
                $fileContent = Normalize-ToLF ([System.IO.File]::ReadAllText($localPath, [System.Text.Encoding]::UTF8))
                
                $anyApplied = $false
                foreach ($chunk in $chunks) {
                    $targetContent = Clean-String $chunk.TargetContent
                    $replacementContent = Clean-String $chunk.ReplacementContent
                    
                    if ($targetContent -eq "" -or $null -eq $targetContent) {
                        continue
                    }
                    
                    $targetContent = Normalize-ToLF $targetContent
                    $replacementContent = Normalize-ToLF $replacementContent
                    
                    if ($fileContent.Contains($targetContent)) {
                        $fileContent = $fileContent.Replace($targetContent, $replacementContent)
                        $anyApplied = $true
                    } else {
                        Write-Warning "Step $($data.step_index) Chunk: Target content not found in $localPath!"
                        $preview = $targetContent
                        if ($preview.Length -gt 80) { $preview = $preview.Substring(0, 80) + "..." }
                        Write-Warning "Searched for: '$preview'"
                    }
                }
                if ($anyApplied) {
                    [System.IO.File]::WriteAllText($localPath, $fileContent, [System.Text.Encoding]::UTF8)
                    $stepCount++
                }
            }
        }
    }
}

if ($accumulator -ne "") {
    Write-Warning "Log processing ended with unparsed accumulated text! (Incomplete final JSON object)"
}

Write-Host "Restoration finished. Replayed $stepCount steps."
