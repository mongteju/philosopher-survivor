Add-Type -AssemblyName System.Drawing

function Analyze-SpriteSheet($filePath) {
    Write-Host "============================================="
    Write-Host "Analyzing file: $filePath"
    
    $bmp = [System.Drawing.Bitmap]::FromFile((Get-Item $filePath).FullName)
    $width = $bmp.Width
    $height = $bmp.Height
    Write-Host "Resolution: $width x $height"

    # Let's check how many non-transparent pixels are in each column and row
    # We will sample pixels to find the bounding box of non-transparent areas in the sheet
    $minX = $width
    $maxX = 0
    $minY = $height
    $maxY = 0

    # Sample pixels at 4px steps to be fast
    for ($y = 0; $y -lt $height; $y += 4) {
        for ($x = 0; $x -lt $width; $x += 4) {
            $pixel = $bmp.GetPixel($x, $y)
            if ($pixel.A -gt 10) { # Non-transparent
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }

    Write-Host "Bounding Box of all characters: X=[$minX, $maxX], Y=[$minY, $maxY]"
    
    # Let's count non-transparent pixels in columns to see if there are clear gaps
    # Divide the width into 12 columns
    $colWidth = $width / 12
    Write-Host "12 Columns width: $colWidth px each"
    
    # We can check the pixel distribution in the first row of characters
    # If 12x6: Cell height is height / 6
    # If 12x8: Cell height is height / 8
    $cellH6 = $height / 6
    $cellH8 = $height / 8
    
    Write-Host "Cell height if 12x6: $cellH6 px"
    Write-Host "Cell height if 12x8: $cellH8 px"

    # Let's check a few specific spots.
    # In row 0 (down facing frame 0), where are the non-transparent pixels?
    # Let's find the bounding box inside cell [0, 0] if 12x6:
    $cell00_minX = $width
    $cell00_maxX = 0
    for ($y = 0; $y -lt $cellH6; $y += 2) {
        for ($x = 0; $x -lt $colWidth; $x += 2) {
            $pixel = $bmp.GetPixel($x, $y)
            if ($pixel.A -gt 10) {
                if ($x -lt $cell00_minX) { $cell00_minX = $x }
                if ($x -gt $cell00_maxX) { $cell00_maxX = $x }
            }
        }
    }
    Write-Host "Cell [0,0] bounding box if 12x6: X=[$cell00_minX, $cell00_maxX]"

    # If 12x8, cell 0,0:
    $cell00_minX8 = $width
    $cell00_maxX8 = 0
    for ($y = 0; $y -lt $cellH8; $y += 2) {
        for ($x = 0; $x -lt $colWidth; $x += 2) {
            $pixel = $bmp.GetPixel($x, $y)
            if ($pixel.A -gt 10) {
                if ($x -lt $cell00_minX8) { $cell00_minX8 = $x }
                if ($x -gt $cell00_maxX8) { $cell00_maxX8 = $x }
            }
        }
    }
    Write-Host "Cell [0,0] bounding box if 12x8: X=[$cell00_minX8, $cell00_maxX8]"

    $bmp.Dispose()
}

Analyze-SpriteSheet "sprite/plato_sprite_sheet_clean.png"
Analyze-SpriteSheet "sprite/aristotle_clean.png"
