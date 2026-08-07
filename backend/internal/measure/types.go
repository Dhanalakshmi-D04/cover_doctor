package measure

// BoundingBox is a simple pixel-space rectangle shared across measure
// functions.
type BoundingBox struct {
	Left, Top, Width, Height int
}
