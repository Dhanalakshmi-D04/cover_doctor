package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"

	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/ai"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/config"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/db"
	"github.com/Dhanalakshmi-D04/cover_doctor/backend/internal/scraper"
)

func main() {
	_ = godotenv.Load()

	overwriteFlag := flag.Bool("overwrite", false, "Clear benchmarks table before inserting fresh snapshot")
	limitFlag := flag.Int("limit", 15, "Target sample count per visual style category")
	tempDirFlag := flag.String("temp-dir", "uploads/scraper_temp", "Temporary directory for processing downloaded covers")
	flag.Parse()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load configuration: %v", err)
	}

	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer func() { _ = database.Close() }()

	aiClient := ai.NewClient(cfg.AnthropicAPIKey)

	opts := scraper.Options{
		Styles:        scraper.DefaultOptions().Styles,
		LimitPerStyle: *limitFlag,
		TempDir:       *tempDirFlag,
		OverwriteData: *overwriteFlag,
		HTTPTimeout:   15 * time.Second,
	}

	sources := []scraper.BestsellerSource{
		scraper.NewAmazonSource(15 * time.Second),
		scraper.NewSampleSource(),
	}

	fmt.Println("=====================================================")
	fmt.Println(" Starting CoverDoctor Automated Quarterly Scraper CLI")
	fmt.Println("=====================================================")
	fmt.Printf(" Target styles : %v\n", opts.Styles)
	fmt.Printf(" Limit per style: %d\n", opts.LimitPerStyle)
	fmt.Printf(" Overwrite mode : %t\n", opts.OverwriteData)
	fmt.Println("-----------------------------------------------------")

	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Minute)
	defer cancel()

	result, err := scraper.ScrapeAndSave(ctx, database, aiClient, sources, opts)
	if err != nil {
		log.Fatalf("Scraper execution failed: %v", err)
	}

	fmt.Println("-----------------------------------------------------")
	fmt.Println(" Scraper Execution Summary:")
	fmt.Printf("   Duration       : %.2f seconds\n", result.DurationSeconds)
	fmt.Printf("   Total Fetched  : %d\n", result.TotalFetched)
	fmt.Printf("   Total Processed: %d\n", result.TotalProcessed)
	fmt.Printf("   Total Inserted : %d\n", result.TotalInserted)
	fmt.Println("   Inserted by Style:")
	for style, count := range result.ByStyle {
		fmt.Printf("     - %-20s: %d covers\n", style, count)
	}
	if len(result.Errors) > 0 {
		fmt.Printf("   Warnings/Errors (%d):\n", len(result.Errors))
		for _, e := range result.Errors {
			fmt.Printf("     ! %s\n", e)
		}
	}
	fmt.Println("=====================================================")

	os.Exit(0)
}
