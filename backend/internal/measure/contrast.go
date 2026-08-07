package measure

import (
	"errors"
	"image"
	"image/color"
	"math"
	"sort"
)

// ErrEmptyRegion is returned when a bounding box contains no sampleable
// pixels.
var ErrEmptyRegion = errors.New("measure: bounding box contains no pixels")

// ContrastRatio estimates the contrast between a piece of text and its
// background using the standard WCAG relative-luminance formula. Rather
// than separately segmenting "ink" pixels from "paper" pixels (a much
// harder problem), it samples every pixel inside the given bounding box and
// compares the luminance of the darkest 10% against the lightest 10% — for
// text sitting on a background, those extremes closely approximate the two
// real colors involved.
func ContrastRatio(img image.Image, box BoundingBox) (float64, error) {
	bounds := img.Bounds()

	left := max(box.Left, bounds.Min.X)
	top := max(box.Top, bounds.Min.Y)
	right := min(box.Left+box.Width, bounds.Max.X)
	bottom := min(box.Top+box.Height, bounds.Max.Y)

	if right <= left || bottom <= top {
		return 0, ErrEmptyRegion
	}

	var luminances []float64
	for y := top; y < bottom; y++ {
		for x := left; x < right; x++ {
			luminances = append(luminances, relativeLuminance(img.At(x, y)))
		}
	}

	if len(luminances) == 0 {
		return 0, ErrEmptyRegion
	}

	sort.Float64s(luminances)

	darkIndex := int(float64(len(luminances)) * 0.10)
	lightIndex := int(float64(len(luminances)) * 0.90)
	if lightIndex >= len(luminances) {
		lightIndex = len(luminances) - 1
	}

	dark := luminances[darkIndex]
	light := luminances[lightIndex]

	return (light + 0.05) / (dark + 0.05), nil
}

// relativeLuminance implements the WCAG 2.x relative luminance formula.
func relativeLuminance(c color.Color) float64 {
	r, g, b, _ := c.RGBA()
	// color.Color.RGBA() returns 16-bit values; scale down to the 0-1 range.
	rf := linearize(float64(r) / 65535)
	gf := linearize(float64(g) / 65535)
	bf := linearize(float64(b) / 65535)

	return 0.2126*rf + 0.7152*gf + 0.0722*bf
}

func linearize(channel float64) float64 {
	if channel <= 0.03928 {
		return channel / 12.92
	}
	return math.Pow((channel+0.055)/1.055, 2.4)
}
