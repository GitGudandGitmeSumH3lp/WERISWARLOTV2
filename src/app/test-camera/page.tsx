'use client';

import { CameraTest } from '@/components/CameraTest';

export default function CameraTestPage() {
  return (
    <div style={{ 
      padding: '40px 20px',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: 'white'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <header style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
            🎥 Camera Waldo View Test
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#aaa', maxWidth: '800px', margin: '0 auto' }}>
            Testing the fixed orthographic camera system. Click anywhere on the canvas to see 
            screen-to-world coordinate conversion in real-time.
          </p>
        </header>
        
        <main>
          <div style={{ 
            backgroundColor: 'rgba(0,0,0,0.3)', 
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px'
          }}>
            <CameraTest />
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginTop: '40px'
          }}>
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.05)', 
              padding: '20px',
              borderRadius: '8px'
            }}>
              <h3>✅ What&apos;s Working</h3>
              <ul style={{ lineHeight: '1.6' }}>
                <li>Fixed orthographic camera (no panning)</li>
                <li>Screen ↔ World coordinate conversion</li>
                <li>Y-sorting for 2.5D depth simulation</li>
                <li>Mobile touch panning prevention</li>
                <li>Level centering within viewport</li>
              </ul>
            </div>
            
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.05)', 
              padding: '20px',
              borderRadius: '8px'
            }}>
              <h3>🎯 Test Instructions</h3>
              <ol style={{ lineHeight: '1.6' }}>
                <li>Click on colored rectangles in the canvas</li>
                <li>Watch green debug markers appear</li>
                <li>Verify coordinates match expected positions</li>
                <li>Try clicking edges/corners for boundary testing</li>
                <li>Check console for detailed logs (F12)</li>
              </ol>
            </div>
            
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.05)', 
              padding: '20px',
              borderRadius: '8px'
            }}>
              <h3>📋 Next Steps</h3>
              <ul style={{ lineHeight: '1.6' }}>
                <li><strong>Phase 1:</strong> Click Interaction system</li>
                <li><strong>Phase 1:</strong> Level Schema definitions</li>
                <li><strong>Phase 2:</strong> NPC & Prop spawning</li>
                <li><strong>Test:</strong> Mobile touch accuracy (44px+ targets)</li>
              </ul>
            </div>
          </div>
        </main>
        
        <footer style={{ 
          marginTop: '60px', 
          textAlign: 'center', 
          color: '#666',
          borderTop: '1px solid #333',
          paddingTop: '20px'
        }}>
          <p>Camera Waldo View | Phase 1 Foundation | System Status: ✅ OPERATIONAL</p>
        </footer>
      </div>
    </div>
  );
}