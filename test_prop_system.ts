// File: test_prop_system.ts
import { PropPool } from './src/systems/inventory/PropPool';
import { WorldBuilder } from './src/systems/world/PropSpawner';
import { HeatManager } from './src/systems/combat/HeatManager';
import { UIBridge } from './src/systems/ui/UIBridge';

async function testFullSystem() {
    console.log('=== PROP SYSTEM INTEGRATION TEST ===\n');
    
    // Step 1: Generate props
    console.log('1. Generating props...');
    const propPool = new PropPool();
    const props = propPool.generateForLevel(3, 'park');
    console.log(`   Generated ${props.length} props\n`);
    
    // Step 2: Place props in world
    console.log('2. Building world...');
    const worldBuilder = new WorldBuilder();
    const level = worldBuilder.buildLevel(3, 'park', {});
    console.log(`   Built level with ${level.props.length} placed props\n`);
    
    // Step 3: Test heat system
    console.log('3. Testing heat system...');
    const heatManager = new HeatManager();
    heatManager.triggerHeatEvent('container_search');
    console.log(`   Heat after container search: ${heatManager.currentHeat}\n`);
    
    // Step 4: Test UI bridge
    console.log('4. Testing UI bridge...');
    const uiBridge = new UIBridge();
    console.log(`   UI Bridge initialized: ${!!uiBridge}\n`);
    
    console.log('=== TEST COMPLETE ===');
}

testFullSystem();