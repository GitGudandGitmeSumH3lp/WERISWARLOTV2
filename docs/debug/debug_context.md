## Error Type
Runtime TypeError

## Error Message
__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$core$2f$CameraController$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__.CameraController.destroy is not a function


    at CameraTest.useEffect (src/components/CameraTest.tsx:151:26)
    at CameraTest (<anonymous>:null:null)

## Code Frame
  149 |       mounted = false;
  150 |       if (CameraController.isInitialized()) {
> 151 |         CameraController.destroy();
      |                          ^
  152 |       }
  153 |     };
  154 |   }, [finalConfig]);

Next.js version: 16.1.1 (Turbopack)

## Error Type
Runtime TypeError

## Error Message
__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$core$2f$CameraController$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__.CameraController.destroy is not a function


    at CameraTest.useEffect (src/components/CameraTest.tsx:151:26)
    at CameraTestPage (src/app/test-camera/page.tsx:31:13)

## Code Frame
  149 |       mounted = false;
  150 |       if (CameraController.isInitialized()) {
> 151 |         CameraController.destroy();
      |                          ^
  152 |       }
  153 |     };
  154 |   }, [finalConfig]);

Next.js version: 16.1.1 (Turbopack)

## Error Type
Console TypeError

## Error Message
__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$core$2f$CameraController$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__.CameraController.destroy is not a function


    at init (src/components/CameraTest.tsx:42:28)
    at CameraTest.useEffect (src/components/CameraTest.tsx:145:5)
    at CameraTestPage (src/app/test-camera/page.tsx:31:13)

## Code Frame
  40 |         // Clean up any previous instance
  41 |         if (CameraController.isInitialized()) {
> 42 |           CameraController.destroy();
     |                            ^
  43 |         }
  44 |
  45 |         // Initialize camera

Next.js version: 16.1.1 (Turbopack)

## Error Type
Console Error

## Error Message
[Loader.load] Failed to load http://localhost:3001/test_spritesheet.png.
Error: [WorkerManager.loadImageBitmap] Failed to fetch http://localhost:3001/test_spritesheet.png: 404 Not Found

Next.js version: 16.1.1 (Turbopack)
