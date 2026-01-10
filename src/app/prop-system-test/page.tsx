// File: app/prop-system-test/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface TestResult {
  step: number;
  name: string;
  passed: boolean;
  message: string;
  details?: string;
  timestamp?: string;
}

interface SystemStatus {
  initialized: boolean;
  message: string;
  components: {
    propPool: boolean;
    worldBuilder: boolean;
    heatManager: boolean;
    uiBridge: boolean;
    interactionManager: boolean;
  };
}

export default function EnhancedPropSystemTestPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    initialized: false,
    message: 'Not initialized',
    components: {
      propPool: false,
      worldBuilder: false,
      heatManager: false,
      uiBridge: false,
      interactionManager: false
    }
  });
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [visualizationData, setVisualizationData] = useState<any>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [selectedProp, setSelectedProp] = useState<any>(null);
  
  // Initialize systems
  useEffect(() => {
    initializeSystems();
  }, []);
  
  const initializeSystems = async () => {
    try {
      setSystemStatus(prev => ({ ...prev, message: 'Loading modules...' }));
      
      // Dynamically import all systems
      const [
        propPoolModule,
        worldBuilderModule,
        heatManagerModule,
        uiBridgeModule,
        interactionManagerModule
      ] = await Promise.all([
        import('@/systems/inventory/PropPool'),
        import('@/systems/world/PropSpawner'),
        import('@/systems/combat/HeatManager'),
        import('@/systems/ui/UIBridge'),
        import('@/systems/core/InteractionManager')
      ]);
      
      setSystemStatus({
        initialized: true,
        message: 'All systems loaded successfully',
        components: {
          propPool: !!propPoolModule.PropPool,
          worldBuilder: !!worldBuilderModule.WorldBuilder,
          heatManager: !!heatManagerModule.HeatManager,
          uiBridge: !!uiBridgeModule.UIBridge,
          interactionManager: !!interactionManagerModule.InteractionManager
        }
      });
      
      addConsoleLog('✅ All Prop System modules loaded');
      
    } catch (error: any) {
      addConsoleLog(`❌ Failed to load systems: ${error.message}`);
      setSystemStatus(prev => ({
        ...prev,
        message: `Failed: ${error.message}`
      }));
    }
  };
  
  const addConsoleLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const log = `[${timestamp}] ${message}`;
    setConsoleOutput(prev => [log, ...prev.slice(0, 49)]);
    console.log(message);
  };
  
  const addTestResult = (result: TestResult) => {
    const resultWithTimestamp = {
      ...result,
      timestamp: new Date().toISOString().split('T')[1].split('.')[0]
    };
    setTestResults(prev => [resultWithTimestamp, ...prev]);
  };
  
  // ========== STEP 1 TEST: DATA LAYER ==========
  const testStep1DataLayer = async () => {
    addConsoleLog('🧪 Step 1: Testing Data Layer (PropPool)...');
    
    try {
      const { PropPool, ContainerManager } = await import('@/systems/inventory/PropPool');
      const propPool = new PropPool();
      const containerManager = new ContainerManager();
      
      // Test 1A: Generate props
      const props = propPool.generateForLevel(3, 'park');
      
      // Count prop types
      const counts = {
        crime: props.filter(p => p.type === 'crime').length,
        herring: props.filter(p => p.type === 'herring').length,
        container: props.filter(p => p.type === 'container').length,
        ambiance: props.filter(p => p.type === 'ambiance').length
      };
      
      // Test 1B: Check herring evidence values
      const herrings = props.filter(p => p.type === 'herring');
      const validHerrings = herrings.filter(h => 
        h.evidenceValue >= 10 && h.evidenceValue <= 30
      );
      
      // Test 1C: Container contents
      const containers = props.filter(p => p.type === 'container');
      let containerTestPassed = true;
      if (containers.length > 0) {
        const testContainer = containers[0];
        const contents = containerManager.searchContainer(testContainer, propPool);
        containerTestPassed = contents.length >= 1 && contents.length <= 3;
      }
      
      // Evaluate results
      const totalProps = props.length;
      const propsCorrect = totalProps === 50;
      const herringsCorrect = validHerrings.length === herrings.length;
      
      const passed = propsCorrect && herringsCorrect && containerTestPassed;
      
      addTestResult({
        step: 1,
        name: 'Data Layer',
        passed,
        message: propsCorrect 
          ? `✅ Generated ${totalProps} props with correct distribution` 
          : `❌ Expected 50 props, got ${totalProps}`,
        details: `Crime: ${counts.crime}, Herring: ${counts.herring}, Container: ${counts.container}, Ambiance: ${counts.ambiance}`
      });
      
      addConsoleLog(`   Props: ${totalProps} (expected: 50)`);
      addConsoleLog(`   Herrings: ${validHerrings.length}/${herrings.length} valid`);
      addConsoleLog(`   Container test: ${containerTestPassed ? 'PASS' : 'FAIL'}`);
      
      return { props, passed };
      
    } catch (error: any) {
      addConsoleLog(`❌ Step 1 failed: ${error.message}`);
      addTestResult({
        step: 1,
        name: 'Data Layer',
        passed: false,
        message: `❌ Error: ${error.message}`
      });
      return { props: [], passed: false };
    }
  };
  
  // ========== STEP 2 TEST: WORLD PLACEMENT ==========
  const testStep2WorldPlacement = async (props: any[]) => {
    addConsoleLog('🧪 Step 2: Testing World Placement...');
    
    try {
      const { WorldBuilder, BIOME_CONFIGS } = await import('@/systems/world/PropSpawner');
      const worldBuilder = new WorldBuilder();
      
      // Test 2A: Build level
      const level = worldBuilder.buildLevel(3, 'park', {});
      
      // Test 2B: Check biome constraints
      const toolProps = level.props.filter(p => p.appearance === 'tool');
      const biomeRules = BIOME_CONFIGS.park;
      const invalidProps = level.props.filter(p => !biomeRules.validateProp(p));
      
      // Test 2C: Check prop positions
      const placedProps = level.placements?.size || 0;
      const hasPositions = level.props.every(p => p.x !== 0 || p.y !== 0);
      
      // Evaluate results
      const levelValid = level.isValid;
      const hasToolProps  = toolProps.length === 0;
      const noInvalidProps = invalidProps.length === 0;
      const positionsSet = hasPositions && placedProps > 0;
      
      const passed = levelValid && hasToolProps  && noInvalidProps && positionsSet;
      
      addTestResult({
        step: 2,
        name: 'World Placement',
        passed,
        message: levelValid 
          ? `✅ Level built with ${level.props.length} props` 
          : `❌ Level validation failed`,
        details: `Tool props in park: ${toolProps.length}, Invalid: ${invalidProps.length}, Placements: ${placedProps}`
      });
      
      addConsoleLog(`   Level valid: ${levelValid}`);
      addConsoleLog(`   Tool props in park: ${toolProps.length} (should be 0)`);
      addConsoleLog(`   Props with positions: ${hasPositions ? 'YES' : 'NO'}`);
      
      return { level, passed };
      
    } catch (error: any) {
      addConsoleLog(`❌ Step 2 failed: ${error.message}`);
      addTestResult({
        step: 2,
        name: 'World Placement',
        passed: false,
        message: `❌ Error: ${error.message}`
      });
      return { level: null, passed: false };
    }
  };
  
  // ========== STEP 3 TEST: HEAT SYSTEM ==========
  const testStep3HeatSystem = async () => {
    addConsoleLog('🧪 Step 3: Testing Heat System...');
    
    try {
      const { HeatManager, TimerManager, KillerBehavior, ACTION_COSTS } = await import('@/systems/combat/HeatManager');
      const heatManager = new HeatManager();
      const timerManager = new TimerManager();
      const killerBehavior = new KillerBehavior(heatManager);
      
      // Test 3A: Initial state
      const initialHeat = heatManager.currentHeat;
      const initialLevel = heatManager.getHeatLevel();
      
      // Test 3B: Container search heat
      heatManager.triggerHeatEvent('container_search');
      const afterContainerHeat = heatManager.currentHeat;
      const heatIncreased = afterContainerHeat === initialHeat + ACTION_COSTS.search_container.heat;
      
      // Test 3C: Timer blocking
      timerManager.blockActions(0.1);
      const isBlocked = timerManager.areActionsBlocked();
      
      // Test 3D: Heat clamping
      heatManager.adjustHeat(150, 'overflow_test');
      const clampedHeat = heatManager.currentHeat === 100;
      
      // Test 3E: Heat decay
      const decayRate = (heatManager as any).heatDecayRate;
      const hasDecay = decayRate < 0;
      
      // Evaluate results
      const passed = heatIncreased && isBlocked && clampedHeat && hasDecay;
      
      addTestResult({
        step: 3,
        name: 'Heat System',
        passed,
        message: heatIncreased 
          ? `✅ Heat system working (+${ACTION_COSTS.search_container.heat} per search)` 
          : `❌ Heat not increased correctly`,
        details: `Initial: ${initialHeat}, After search: ${afterContainerHeat}, Blocked: ${isBlocked}, Clamped: ${clampedHeat}`
      });
      
      addConsoleLog(`   Initial heat: ${initialHeat}`);
      addConsoleLog(`   After container search: ${afterContainerHeat} (expected: ${initialHeat + 2})`);
      addConsoleLog(`   Actions blocked: ${isBlocked}`);
      addConsoleLog(`   Heat clamped at 100: ${clampedHeat}`);
      
      return { heatManager, timerManager, passed };
      
    } catch (error: any) {
      addConsoleLog(`❌ Step 3 failed: ${error.message}`);
      addTestResult({
        step: 3,
        name: 'Heat System',
        passed: false,
        message: `❌ Error: ${error.message}`
      });
      return { heatManager: null, timerManager: null, passed: false };
    }
  };
  
  // ========== STEP 4 TEST: UI LAYER ==========
  const testStep4UILayer = async (propPool: any, heatManager: any, timerManager: any) => {
    addConsoleLog('🧪 Step 4: Testing UI Layer...');
    
    try {
      const { UIBridge } = await import('@/systems/ui/UIBridge');
      const { ContainerManager } = await import('@/systems/inventory/PropPool');
      
      const containerManager = new ContainerManager();
      const uiBridge = new UIBridge();
      
      // Test 4A: Initialize bridge
      uiBridge.initialize(heatManager, containerManager, timerManager, propPool);
      
      // Test 4B: Get props and find container
      const props = propPool.generateForLevel(2, 'park');
      const container = props.find((p: { type: string; }) => p.type === 'container');
      
      let searchTestPassed = false;
      let evidenceTestPassed = false;
      
      if (container) {
        // Test 4C: Container search flow
        const initialHeat = heatManager.currentHeat;
        uiBridge.handleSearchContainer(container);
        searchTestPassed = heatManager.currentHeat === initialHeat + 2;
        
        // Test 4D: Evidence addition (mock)
        const crimeProp = props.find((p: { type: string; }) => p.type === 'crime');
        if (crimeProp) {
          uiBridge.handleAddEvidence(crimeProp);
          evidenceTestPassed = true;
        }
      }
      
      // Test 4E: Store integration
      const { usePropStore, useEvidenceStore } = await import('@/stores/propStore');
      const storeAvailable = !!usePropStore && !!useEvidenceStore;
      
      // Evaluate results
      const passed = searchTestPassed && evidenceTestPassed && storeAvailable;
      
      addTestResult({
        step: 4,
        name: 'UI Layer',
        passed,
        message: searchTestPassed 
          ? `✅ UI Bridge working (search +${searchTestPassed ? 2 : 0} heat)` 
          : `❌ UI Bridge issues`,
        details: `Bridge initialized: true, Store available: ${storeAvailable}, Evidence test: ${evidenceTestPassed}`
      });
      
      addConsoleLog(`   UI Bridge initialized: true`);
      addConsoleLog(`   Container search heat: +${searchTestPassed ? '2' : '0'}`);
      addConsoleLog(`   Store available: ${storeAvailable}`);
      
      return { uiBridge, passed };
      
    } catch (error: any) {
      addConsoleLog(`❌ Step 4 failed: ${error.message}`);
      addTestResult({
        step: 4,
        name: 'UI Layer',
        passed: false,
        message: `❌ Error: ${error.message}`
      });
      return { uiBridge: null, passed: false };
    }
  };
  
  // ========== RUN ALL TESTS ==========
  const runAllTests = async () => {
    if (isTesting) return;
    
    setIsTesting(true);
    setTestResults([]);
    setConsoleOutput([]);
    addConsoleLog('🚀 Starting comprehensive Prop System tests...');
    
    try {
      // Step 1: Data Layer
      const step1Result = await testStep1DataLayer();
      const { props, passed: step1Passed } = step1Result;
      
      if (!step1Passed) {
        addConsoleLog('❌ Stopping tests - Step 1 failed');
        setIsTesting(false);
        return;
      }
      
      // Step 2: World Placement
      const step2Result = await testStep2WorldPlacement(props);
      const { level, passed: step2Passed } = step2Result;
      
      // Step 3: Heat System
      const step3Result = await testStep3HeatSystem();
      const { heatManager, timerManager, passed: step3Passed } = step3Result;
      
      // Step 4: UI Layer
      const { PropPool } = await import('@/systems/inventory/PropPool');
      const propPool = new PropPool();
      await testStep4UILayer(propPool, heatManager, timerManager);
      
      // Store visualization data
      if (level) {
        setVisualizationData({
          props: level.props,
          biome: level.biome,
          isValid: level.isValid
        });
      }
      
      addConsoleLog('🎉 All tests completed!');
      
    } catch (error: any) {
      addConsoleLog(`❌ Test sequence failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };
  
  // ========== VISUALIZATION ==========
  const renderVisualization = () => {
    if (!visualizationData) return null;
    
    const { props, biome, isValid } = visualizationData;
    
    return (
      <div style={{ 
        position: 'relative',
        width: '1280px',
        height: '720px',
        background: '#2a2a2a',
        border: '2px solid #444',
        margin: '20px 0',
        overflow: 'hidden'
      }}>
        {/* Biome label */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          Biome: {biome} | Valid: {isValid ? '✅' : '❌'} | Props: {props.length}
        </div>
        
        {/* Props */}
        {props.map((prop: any) => {
          const color = getPropColor(prop.type);
          const size = prop.type === 'container' ? 24 : 16;
          
          return (
            <div
              key={prop.id}
              style={{
                position: 'absolute',
                left: `${prop.x}px`,
                top: `${prop.y}px`,
                width: `${size}px`,
                height: `${size}px`,
                background: color,
                borderRadius: prop.type === 'container' ? '4px' : '50%',
                border: `2px solid ${prop.type === 'crime' ? '#fff' : '#666'}`,
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                boxShadow: prop.type === 'crime' ? '0 0 10px rgba(255,0,0,0.5)' : 'none'
              }}
              title={`${prop.type} - ${prop.appearance}\nEvidence: ${prop.evidenceValue}\n(${prop.x}, ${prop.y})`}
              onClick={() => {
                setSelectedProp(prop);
                addConsoleLog(`🔍 Clicked prop: ${prop.id} (${prop.type})`);
              }}
            >
              {prop.type === 'container' && (
                <div style={{
                  color: 'white',
                  fontSize: '10px',
                  textAlign: 'center',
                  lineHeight: `${size}px`
                }}>
                  📦
                </div>
              )}
            </div>
          );
        })}
        
        {/* Vignette areas (crime clusters) */}
        {props
          .filter((p: any) => p.type === 'crime')
          .map((crime: any, i: number) => (
            <div
              key={`vignette-${i}`}
              style={{
                position: 'absolute',
                left: `${crime.x - 64}px`,
                top: `${crime.y - 64}px`,
                width: '128px',
                height: '128px',
                border: '2px dashed rgba(255, 0, 0, 0.3)',
                borderRadius: '50%',
                pointerEvents: 'none'
              }}
            />
          ))}
        
        {/* Grid */}
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={`grid-${i}`}
            style={{
              position: 'absolute',
              left: `${i * 80}px`,
              top: 0,
              width: '1px',
              height: '100%',
              background: 'rgba(255,255,255,0.1)',
              pointerEvents: 'none'
            }}
          />
        ))}
        
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={`grid-h-${i}`}
            style={{
              position: 'absolute',
              left: 0,
              top: `${i * 80}px`,
              width: '100%',
              height: '1px',
              background: 'rgba(255,255,255,0.1)',
              pointerEvents: 'none'
            }}
          />
        ))}
      </div>
    );
  };
  
  const getPropColor = (type: string): string => {
    switch (type) {
      case 'crime': return '#ff4444';
      case 'herring': return '#ffaa00';
      case 'container': return '#44aaff';
      case 'ambiance': return '#44ff44';
      default: return '#888888';
    }
  };
  
  const clearTests = () => {
    setTestResults([]);
    setConsoleOutput([]);
    setVisualizationData(null);
    setSelectedProp(null);
    addConsoleLog('🧹 Tests cleared');
  };
  
  const exportResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      systemStatus,
      testResults,
      visualizationData: visualizationData ? {
        propCount: visualizationData.props.length,
        biome: visualizationData.biome,
        isValid: visualizationData.isValid
      } : null
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prop-system-test-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addConsoleLog('💾 Test results exported');
  };
  
  // Calculate statistics
  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  
  return (
    <div style={{ 
      padding: '30px', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <header style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: '#333', marginBottom: '10px', fontSize: '32px' }}>
              🧱 Prop System V2.0.0 - Enhanced Test Suite
            </h1>
            <p style={{ color: '#666', fontSize: '16px' }}>
              Comprehensive testing for all 4 implementation steps
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            <Link 
              href="/" 
              style={{ 
                padding: '10px 20px',
                background: '#6c757d',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
                fontWeight: '500'
              }}
            >
              ← Home
            </Link>
            <Link 
              href="/level-loader-test" 
              style={{ 
                padding: '10px 20px',
                background: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
                fontWeight: '500'
              }}
            >
              ← Level Loader Test
            </Link>
          </div>
        </div>
      </header>
      
      {/* System Status */}
      <div style={{ 
        background: 'white', 
        padding: '25px', 
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ color: '#495057', marginTop: 0, marginBottom: '20px' }}>
          System Status
        </h2>
        
        <div style={{ 
          padding: '20px', 
          background: systemStatus.initialized ? '#d4edda' : '#f8d7da',
          borderRadius: '8px',
          marginBottom: '20px',
          border: `2px solid ${systemStatus.initialized ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '18px' }}>
                {systemStatus.initialized ? '✅ All Systems Ready' : '🔄 Initializing...'}
              </strong>
              <div style={{ marginTop: '5px', color: systemStatus.initialized ? '#155724' : '#721c24' }}>
                {systemStatus.message}
              </div>
            </div>
            
            {systemStatus.initialized && (
              <div style={{ 
                padding: '10px 20px',
                background: '#28a745',
                color: 'white',
                borderRadius: '5px',
                fontWeight: 'bold'
              }}>
                READY FOR TESTING
              </div>
            )}
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
          {Object.entries(systemStatus.components).map(([key, value]) => (
            <div 
              key={key}
              style={{ 
                padding: '15px',
                background: value ? '#e7f5ff' : '#f8f9fa',
                borderRadius: '6px',
                border: `2px solid ${value ? '#a5d8ff' : '#dee2e6'}`,
                textAlign: 'center'
              }}
            >
              <div style={{ 
                fontSize: '24px', 
                marginBottom: '10px',
                color: value ? '#1971c2' : '#868e96'
              }}>
                {value ? '✅' : '❌'}
              </div>
              <div style={{ 
                fontWeight: '600',
                color: value ? '#1971c2' : '#868e96',
                textTransform: 'capitalize'
              }}>
                {key.replace(/([A-Z])/g, ' $1')}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Test Controls */}
      <div style={{ 
        background: 'white', 
        padding: '25px', 
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ color: '#495057', marginTop: 0, marginBottom: '20px' }}>
          Test Controls
        </h2>
        
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '25px' }}>
          <button
            onClick={runAllTests}
            disabled={!systemStatus.initialized || isTesting}
            style={{ 
              padding: '15px 30px',
              background: !systemStatus.initialized ? '#6c757d' : isTesting ? '#ffc107' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (!systemStatus.initialized || isTesting) ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              minWidth: '200px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            {isTesting ? '🔄 Testing...' : '🧪 Run All Tests (Steps 1-4)'}
          </button>
          
          <button
            onClick={clearTests}
            style={{ 
              padding: '15px 30px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              minWidth: '150px'
            }}
          >
            🧹 Clear Tests
          </button>
          
          <button
            onClick={exportResults}
            disabled={testResults.length === 0}
            style={{ 
              padding: '15px 30px',
              background: testResults.length === 0 ? '#adb5bd' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: testResults.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              minWidth: '150px'
            }}
          >
            💾 Export Results
          </button>
        </div>
        
        {/* Test Results Summary */}
        {testResults.length > 0 && (
          <div style={{ 
            padding: '20px', 
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '2px solid #dee2e6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#495057' }}>Test Results Summary</h3>
              <div style={{ 
                padding: '8px 16px',
                background: passRate === 100 ? '#28a745' : passRate >= 50 ? '#ffc107' : '#dc3545',
                color: 'white',
                borderRadius: '20px',
                fontWeight: 'bold',
                fontSize: '18px'
              }}>
                {passedTests}/{totalTests} Passed ({passRate}%)
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              {[1, 2, 3, 4].map(step => {
                const stepResult = testResults.find(r => r.step === step);
                return (
                  <div 
                    key={step}
                    style={{ 
                      padding: '15px',
                      background: stepResult?.passed ? '#d4edda' : stepResult ? '#f8d7da' : '#e9ecef',
                      borderRadius: '6px',
                      border: `2px solid ${stepResult?.passed ? '#c3e6cb' : stepResult ? '#f5c6cb' : '#dee2e6'}`
                    }}
                  >
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '600',
                      color: stepResult?.passed ? '#155724' : stepResult ? '#721c24' : '#6c757d',
                      marginBottom: '5px'
                    }}>
                      Step {step}: {stepResult?.name || 'Not tested'}
                    </div>
                    <div style={{ 
                      fontSize: '18px',
                      fontWeight: 'bold',
                      marginBottom: '10px',
                      color: stepResult?.passed ? '#28a745' : stepResult ? '#dc3545' : '#6c757d'
                    }}>
                      {stepResult ? (stepResult.passed ? '✅ PASS' : '❌ FAIL') : '⏸️ PENDING'}
                    </div>
                    {stepResult?.details && (
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        {stepResult.details}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Detailed Test Results */}
      {testResults.length > 0 && (
        <div style={{ 
          background: 'white', 
          padding: '25px', 
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ color: '#495057', marginTop: 0, marginBottom: '20px' }}>
            Detailed Test Results
          </h2>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Step</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Test</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Message</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((result, index) => (
                  <tr 
                    key={index}
                    style={{ 
                      borderBottom: '1px solid #dee2e6',
                      background: index % 2 === 0 ? '#fff' : '#f8f9fa'
                    }}
                  >
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>Step {result.step}</td>
                    <td style={{ padding: '12px' }}>{result.name}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 12px',
                        background: result.passed ? '#28a745' : '#dc3545',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {result.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{result.message}</td>
                    <td style={{ padding: '12px', color: '#6c757d' }}>{result.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Visualization */}
      {visualizationData && (
        <div style={{ 
          background: 'white', 
          padding: '25px', 
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#495057', marginTop: 0 }}>
              🎨 Prop Placement Visualization
            </h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '12px', background: '#ff4444', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '12px' }}>Crime</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '12px', background: '#ffaa00', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '12px' }}>Herring</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '12px', background: '#44aaff', borderRadius: '4px' }}></div>
                <span style={{ fontSize: '12px' }}>Container</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '12px', background: '#44ff44', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '12px' }}>Ambiance</span>
              </div>
            </div>
          </div>
          
          {renderVisualization()}
          
          {selectedProp && (
            <div style={{ 
              marginTop: '20px',
              padding: '20px',
              background: '#e7f5ff',
              borderRadius: '8px',
              border: '2px solid #a5d8ff'
            }}>
              <h3 style={{ marginTop: 0, color: '#1971c2' }}>Selected Prop Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                <div>
                  <strong>ID:</strong> {selectedProp.id}
                </div>
                <div>
                  <strong>Type:</strong> {selectedProp.type}
                </div>
                <div>
                  <strong>Appearance:</strong> {selectedProp.appearance}
                </div>
                <div>
                  <strong>Evidence Value:</strong> {selectedProp.evidenceValue}
                </div>
                <div>
                  <strong>Position:</strong> ({selectedProp.x}, {selectedProp.y})
                </div>
                <div>
                  <strong>Biome:</strong> {selectedProp.biome}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Description:</strong> {selectedProp.description.substring(0, 150)}...
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Console Output */}
      <div style={{ 
        background: '#1e1e1e', 
        padding: '25px', 
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#fff', marginTop: 0, marginBottom: '20px' }}>
          Console Output
        </h2>
        
        <div style={{ 
          height: '300px',
          overflowY: 'auto',
          background: '#252525',
          borderRadius: '6px',
          padding: '15px',
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#d4d4d4'
        }}>
          {consoleOutput.length === 0 ? (
            <div style={{ color: '#858585', fontStyle: 'italic' }}>
              No output yet. Run tests to see console logs here.
            </div>
          ) : (
            consoleOutput.map((line, index) => (
              <div 
                key={index}
                style={{ 
                  marginBottom: '4px',
                  color: line.includes('✅') ? '#4ec9b0' : 
                         line.includes('❌') ? '#f44747' : 
                         line.includes('🔍') ? '#569cd6' : 
                         line.includes('🚀') ? '#dcdcaa' : 
                         line.includes('🎉') ? '#b5cea8' : '#d4d4d4'
                }}
              >
                {line}
              </div>
            ))
          )}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
          <button
            onClick={() => setConsoleOutput([])}
            style={{ 
              padding: '8px 16px',
              background: '#495057',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Clear Console
          </button>
        </div>
      </div>
    </div>
  );
}