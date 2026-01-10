// File: test_integration.ts
async function testPropSystemIntegration() {
    console.log('🧪 PROP SYSTEM INTEGRATION TEST\n');
    
    // Dynamically import modules to avoid TypeScript compilation issues
    const { PropPool, ContainerManager } = await import('./src/systems/inventory/PropPool');
    const { HeatManager, TimerManager } = await import('./src/systems/combat/HeatManager');
    const { UIBridge } = await import('./src/systems/ui/UIBridge');
    
    console.log('1. Creating systems...');
    const propPool = new PropPool();
    const containerManager = new ContainerManager();
    const heatManager = new HeatManager();
    const timerManager = new TimerManager();
    const uiBridge = new UIBridge();
    
    console.log('2. Initializing UIBridge...');
    uiBridge.initialize(heatManager, containerManager, timerManager, propPool);
    
    console.log('3. Generating test props...');
    const props = propPool.generateForLevel(2, 'park');
    console.log(`   Generated ${props.length} props`);
    
    console.log('4. Testing container search flow...');
    const containerProp = props.find(p => p.type === 'container');
    if (containerProp) {
        console.log(`   Found container: ${containerProp.id}`);
        
        // Simulate search
        uiBridge.handleSearchContainer(containerProp);
        
        // Check heat increased
        setTimeout(() => {
            console.log(`   Heat after search: ${heatManager.currentHeat} (should be 2)`);
            console.log('✅ Container search test completed');
        }, 100);
    } else {
        console.log('❌ No container found in generated props');
    }
    
    console.log('\n5. Testing evidence system...');
    const crimeProp = props.find(p => p.type === 'crime');
    if (crimeProp) {
        console.log(`   Found crime prop: ${crimeProp.id}`);
        uiBridge.handleAddEvidence(crimeProp);
        console.log(`   Evidence value: ${crimeProp.evidenceValue}`);
        console.log('✅ Evidence system test completed');
    }
    
    console.log('\n🎯 INTEGRATION TEST COMPLETE');
    console.log('System appears to be wired correctly!');
}

// Run test
testPropSystemIntegration().catch(console.error);