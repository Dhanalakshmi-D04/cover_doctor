package measure

import (
	"fmt"
	"image"
	"sort"
)

type colorBucket struct {
	r, g, b int
	count   int
}

// ExtractPalette finds the top 5 dominant colors in the image and returns them as hex strings.
// It uses a simple histogram bucketing algorithm for speed.
func ExtractPalette(img image.Image) []string {
	bounds := img.Bounds()
	
	// Subsample for speed (check at most 10,000 pixels)
	stepX := max(1, bounds.Dx()/100)
	stepY := max(1, bounds.Dy()/100)

	buckets := make(map[string]*colorBucket)

	for y := bounds.Min.Y; y < bounds.Max.Y; y += stepY {
		for x := bounds.Min.X; x < bounds.Max.X; x += stepX {
			r, g, b, _ := img.At(x, y).RGBA()
			// Convert from 16-bit to 8-bit
			r8, g8, b8 := int(r>>8), int(g>>8), int(b>>8)
			
			// Group into 64 buckets (4 bins per channel, 0-63, 64-127, 128-191, 192-255)
			binR := r8 / 64
			binG := g8 / 64
			binB := b8 / 64
			
			key := fmt.Sprintf("%d-%d-%d", binR, binG, binB)
			
			if bkt, ok := buckets[key]; ok {
				bkt.r += r8
				bkt.g += g8
				bkt.b += b8
				bkt.count++
			} else {
				buckets[key] = &colorBucket{r: r8, g: g8, b: b8, count: 1}
			}
		}
	}

	// Sort buckets by count
	var sorted []colorBucket
	for _, bkt := range buckets {
		sorted = append(sorted, *bkt)
	}
	
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].count > sorted[j].count
	})

	var hexCodes []string
	limit := min(5, len(sorted))
	for i := 0; i < limit; i++ {
		bkt := sorted[i]
		avgR := bkt.r / bkt.count
		avgG := bkt.g / bkt.count
		avgB := bkt.b / bkt.count
		hexCodes = append(hexCodes, fmt.Sprintf("#%02X%02X%02X", avgR, avgG, avgB))
	}

	return hexCodes
}
