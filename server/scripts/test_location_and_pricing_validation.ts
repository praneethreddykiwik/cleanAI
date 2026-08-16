import { AgentsService, JobComplexityResult } from '../modules/agents/agents.service';
import { ModelRegistry } from '../config/ai/model.registry';

async function runValidationSuite() {
  console.log('====================================================');
  console.log('🧪 CRISKA CLEANAI — LOCATION & PRICING VALIDATION SUITE');
  console.log('====================================================\n');

  const testCases: { name: string; complexity: JobComplexityResult; distanceKm: number }[] = [
    {
      name: 'Scenario 1: Clean Kitchen',
      distanceKm: 3.2, // Free <= 5 km
      complexity: {
        service: 'Kitchen Cleaning',
        confidence: 0.95,
        room: { type: 'Kitchen', estimatedAreaSqft: 100 },
        surfaces: ['Tile', 'Stainless Steel'],
        detectedIssues: [{ type: 'Light Dust', severity: 0.2 }],
        objectsDetected: ['Countertop'],
        recommendedEquipment: ['Scrubbing Brush', 'Microfiber Cloth'],
        workersRequired: 1,
        estimatedDurationHours: 1.5,
        estimatedDuration: '1.5 Hours',
        reasoning: 'Standard clean kitchen inspection.',
      },
    },
    {
      name: 'Scenario 2: Heavily Soiled Bathroom',
      distanceKm: 4.2, // Free <= 5 km
      complexity: {
        service: 'Bathroom Cleaning',
        confidence: 0.92,
        room: { type: 'Bathroom', estimatedAreaSqft: 75 },
        surfaces: ['Tile', 'Glass', 'Ceramic'],
        detectedIssues: [
          { type: 'Thick Limescale', severity: 0.85 },
          { type: 'Tile Mold', severity: 0.75 },
        ],
        objectsDetected: ['Shower Enclosure', 'Toilet', 'Sink'],
        recommendedEquipment: ['Heavy Steam Scrubber', 'Acidic Tile Cleaner', 'Descaling Compound'],
        workersRequired: 1,
        estimatedDurationHours: 2.5,
        estimatedDuration: '2.5 Hours',
        reasoning: 'Heavily soiled bathroom with thick limescale and tile mold.',
      },
    },
    {
      name: 'Scenario 3: Deep Home Cleaning',
      distanceKm: 8.5, // Slab: ₹80
      complexity: {
        service: 'Deep Cleaning',
        confidence: 0.94,
        room: { type: 'Full Flat', estimatedAreaSqft: 250 }, // 50 sq.ft excess -> ₹75
        surfaces: ['Marble', 'Tile', 'Glass', 'Wood'],
        detectedIssues: [
          { type: 'Accumulated Dust', severity: 0.6 },
          { type: 'Window Track Dirt', severity: 0.5 },
        ],
        objectsDetected: ['Sofas', 'Beds', 'Cabinets'],
        recommendedEquipment: ['Industrial Vacuum', 'Floor Polishing Machine'],
        workersRequired: 2, // 1 extra worker -> ₹200
        estimatedDurationHours: 3.5, // 1.5 extra hrs -> ₹225
        estimatedDuration: '3.5 Hours',
        reasoning: 'Deep cleaning across 250 sq.ft flat.',
      },
    },
    {
      name: 'Scenario 4: Bike Wash',
      distanceKm: 2.1, // Free <= 5 km
      complexity: {
        service: 'Bike Wash',
        confidence: 0.98,
        room: { type: 'Outdoor Bay', estimatedAreaSqft: 30 },
        surfaces: ['Metal', 'Chrome', 'Rubber'],
        detectedIssues: [{ type: 'Mud Splashes', severity: 0.3 }],
        objectsDetected: ['Motorcycle'],
        recommendedEquipment: ['Pressure Washer'],
        workersRequired: 1,
        estimatedDurationHours: 0.75,
        estimatedDuration: '45 Mins',
        reasoning: 'Standard exterior bike wash.',
      },
    },
    {
      name: 'Scenario 5: Interior Painting',
      distanceKm: 12.0, // Slab: ₹180
      complexity: {
        service: 'Painting',
        confidence: 0.91,
        room: { type: 'Living Room Walls', estimatedAreaSqft: 400 }, // 200 sq.ft excess -> ₹300
        surfaces: ['Plaster Wall', 'Drywall'],
        detectedIssues: [
          { type: 'Paint Peeling', severity: 0.7 },
          { type: 'Wall Cracks', severity: 0.6 },
        ],
        objectsDetected: ['Walls', 'Ceiling'],
        recommendedEquipment: ['Paint Rollers', 'Putty Scraper', 'Sanding Machine'],
        workersRequired: 2,
        estimatedDurationHours: 6.0,
        estimatedDuration: '6 Hours',
        reasoning: 'Living room wall painting with putty preparation.',
      },
    },
  ];

  for (const test of testCases) {
    console.log(`----------------------------------------------------`);
    console.log(`📋 ${test.name} (${test.distanceKm} km distance)`);
    console.log(`----------------------------------------------------`);

    const result = await AgentsService.calculatePriceEstimate(
      test.complexity,
      false, // weekday
      'Bengaluru',
      test.distanceKm
    );

    console.log(`Base Price: ₹${result.basePrice}`);
    console.log(`Calculated Total Range: ₹${result.totalMin} – ₹${result.totalMax}`);
    console.log(`Transparent Line Items Breakdown:`);

    for (const item of result.lineItems) {
      console.log(`   • ${item.label}: ₹${item.amount} (${item.explanation})`);
    }

    console.log('');
  }

  // Vendor Matching Test
  console.log('----------------------------------------------------');
  console.log('🎯 Testing Vendor Matching Engine with Coordinates');
  console.log('----------------------------------------------------');

  const vendors = await AgentsService.matchBestVendors({
    serviceName: 'Bathroom Cleaning',
    latitude: 12.9716,
    longitude: 77.5946,
    priceRange: { min: 450, max: 650 },
  });

  console.log(`Found ${vendors.length} Matched Vendor(s):`);
  for (const v of vendors) {
    console.log(`   • ${v.businessName} (Rating: ${v.rating}★)`);
    console.log(`     Distance: ${v.distanceKm} km | ETA: ${v.etaMinutes} mins | Match Score: ${v.matchScore}/100`);
    console.log(`     Reason: "${v.reason}"`);
  }

  console.log('\n====================================================');
  console.log('🎉 ALL VALIDATION SCENARIOS EXECUTED SUCCESSFULLY!');
  console.log('====================================================');
  process.exit(0);
}

runValidationSuite().catch((err) => {
  console.error('❌ Validation suite failed:', err);
  process.exit(1);
});
