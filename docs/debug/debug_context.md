## InteractionTest.tsx
red line "initialize" in: 
        // 3. Initialize InteractionManager
        console.log('Step 3: Initializing InteractionManager...');
        try {
          InteractionManager.initialize({
            minHitboxRadius: 22,
            highlightColor: 0xFFFF00,
            tapDebounceMs: 150,
            enableVisualFeedback: true
          });
error log: Property 'initialize' does not exist on type 'typeof InteractionManager'.

red line "registerTarget" in :
          // Register for interaction
          InteractionManager.registerTarget({
            id: `test_npc_${i}`,
            type: "npc",
error log: Property 'registerTarget' does not exist on type 'typeof InteractionManager'.
			
red line "onInteract" in :
        // 5. Subscribe to interactions
        console.log('Step 5: Setting up interaction subscription...');
        const unsubscribe = InteractionManager.onInteract((target) => {
error log: Property 'onInteract' does not exist on type 'typeof InteractionManager'.
		
red line "clearTargets" in :
        // Cleanup function
        return () => {
          console.log('🧹 Cleaning up...');
          unsubscribe();
          InteractionManager.clearTargets();
error log: Property 'clearTargets' does not exist on type 'typeof InteractionManager'.