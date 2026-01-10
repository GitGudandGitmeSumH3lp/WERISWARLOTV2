// File: src/components/InspectionOverlay.tsx

import React, { useEffect, useState } from 'react';
import { Prop } from '../systems/inventory/PropPool';
import { usePropStore } from '../stores/propStore';
import { useEvidenceStore } from '../stores/propStore';
import './InspectionOverlay.css';

// ============================================
// PROPS INTERFACE (Matching ui.md contract)
// ============================================

interface InspectionOverlayProps {
    prop: Prop | null;
    onClose: () => void;
    onAddEvidence: (prop: Prop) => void;
    onSearchContainer: (prop: Prop) => void;
}

// ============================================
// INSPECTION OVERLAY COMPONENT
// ============================================

/**
 * InspectionOverlay React component matching ui.md contract
 * Displays prop inspection interface with evidence options
 */
export const InspectionOverlay: React.FC<InspectionOverlayProps> = ({
    prop,
    onClose,
    onAddEvidence,
    onSearchContainer
}) => {
    const [localProp, setLocalProp] = useState<Prop | null>(prop);
    const { searchInProgress, searchProgress } = usePropStore();
    
    // Update local prop when prop changes
    useEffect(() => {
        setLocalProp(prop);
    }, [prop]);
    
    // Close overlay on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && prop) {
                onClose();
            }
        };
        
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [prop, onClose]);
    
    // Don't render if no prop
    if (!prop) {
        return null;
    }
    
    // Determine evidence value color
    const getEvidenceColor = (value: number): string => {
        if (value > 70) return '#4CAF50'; // Green
        if (value >= 40) return '#FFC107'; // Yellow
        return '#F44336'; // Red
    };
    
    // Check if this is a searchable container
    const isSearchableContainer = prop.type === 'container' && !prop.inspected;
    
    // Handle add to evidence
    const handleAddEvidence = () => {
        if (!prop.addedToEvidence) {
            onAddEvidence(prop);
        }
    };
    
    // Handle container search
    const handleSearchContainer = () => {
        if (isSearchableContainer && !searchInProgress) {
            onSearchContainer(prop);
        }
    };
    
    return (
        <>
            {/* Backdrop */}
            <div 
                className="inspection-backdrop"
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    zIndex: 9998,
                    cursor: 'pointer'
                }}
            />
            
            {/* Modal */}
            <div 
                className="inspection-modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px',
                    height: '400px',
                    backgroundColor: '#1a1a2e',
                    border: '2px solid #4a4a6d',
                    borderRadius: '12px',
                    padding: '24px',
                    zIndex: 9999,
                    color: '#ffffff',
                    fontFamily: 'Arial, sans-serif',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    borderBottom: '1px solid #4a4a6d',
                    paddingBottom: '10px'
                }}>
                    <h2 style={{ 
                        margin: 0, 
                        color: '#e0e0ff',
                        fontSize: '24px',
                        textTransform: 'capitalize'
                    }}>
                        {prop.appearance} Inspection
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#aaa',
                            fontSize: '24px',
                            cursor: 'pointer',
                            padding: '0 8px'
                        }}
                    >
                        ×
                    </button>
                </div>
                
                {/* Content Area */}
                <div style={{ 
                    flex: 1,
                    overflowY: 'auto',
                    marginBottom: '20px',
                    paddingRight: '10px'
                }}>
                    {/* Description */}
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ 
                            color: '#b0b0ff', 
                            marginBottom: '8px',
                            fontSize: '18px'
                        }}>
                            Description
                        </h3>
                        <p style={{ 
                            lineHeight: '1.6',
                            color: '#d0d0ff',
                            fontSize: '16px'
                        }}>
                            {prop.description}
                        </p>
                    </div>
                    
                    {/* Evidence Value */}
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ 
                            color: '#b0b0ff', 
                            marginBottom: '8px',
                            fontSize: '18px'
                        }}>
                            Evidence Value
                        </h3>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px'
                        }}>
                            <div style={{
                                width: '200px',
                                height: '20px',
                                backgroundColor: '#333',
                                borderRadius: '10px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${prop.evidenceValue}%`,
                                    height: '100%',
                                    backgroundColor: getEvidenceColor(prop.evidenceValue),
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                            <span style={{
                                color: getEvidenceColor(prop.evidenceValue),
                                fontWeight: 'bold',
                                fontSize: '18px'
                            }}>
                                {prop.evidenceValue}/100
                            </span>
                        </div>
                    </div>
                    
                    {/* Container Contents (if searched) */}
                    {prop.type === 'container' && prop.contents && prop.contents.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ 
                                color: '#b0b0ff', 
                                marginBottom: '8px',
                                fontSize: '18px'
                            }}>
                                Contents ({prop.contents.length} items)
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                gap: '10px',
                                maxHeight: '120px',
                                overflowY: 'auto',
                                padding: '10px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px'
                            }}>
                                {prop.contents.map((subProp, index) => (
                                    <div 
                                        key={subProp.id}
                                        style={{
                                            padding: '8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        <div style={{ 
                                            fontWeight: 'bold',
                                            color: '#e0e0ff'
                                        }}>
                                            {subProp.appearance}
                                        </div>
                                        <div style={{ 
                                            fontSize: '12px',
                                            color: '#aaa'
                                        }}>
                                            Value: {subProp.evidenceValue}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '15px',
                    justifyContent: 'flex-end',
                    borderTop: '1px solid #4a4a6d',
                    paddingTop: '20px'
                }}>
                    {/* Add to Evidence Button */}
                    <button
                        onClick={handleAddEvidence}
                        disabled={prop.addedToEvidence || searchInProgress}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: prop.addedToEvidence ? '#4a4a6d' : '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: prop.addedToEvidence || searchInProgress ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            opacity: prop.addedToEvidence || searchInProgress ? 0.6 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        {prop.addedToEvidence ? '✓ Added to Evidence' : 'Add to Evidence'}
                    </button>
                    
                    {/* Search Container Button */}
                    {isSearchableContainer && (
                        <button
                            onClick={handleSearchContainer}
                            disabled={searchInProgress}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: searchInProgress ? '#4a4a6d' : '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: searchInProgress ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                opacity: searchInProgress ? 0.6 : 1,
                                transition: 'all 0.2s'
                            }}
                        >
                            {searchInProgress ? 'Searching...' : 'Search Container'}
                        </button>
                    )}
                    
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#666',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                        Close
                    </button>
                </div>
                
                {/* Search Progress Bar (if searching) */}
                {searchInProgress && (
                    <div style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
                        right: '0',
                        height: '4px',
                        backgroundColor: '#333'
                    }}>
                        <div style={{
                            width: `${searchProgress * 100}%`,
                            height: '100%',
                            backgroundColor: '#2196F3',
                            transition: 'width 0.1s linear'
                        }} />
                    </div>
                )}
            </div>
        </>
    );
};

// ============================================
// SEARCH PROGRESS BAR COMPONENT
// ============================================

interface SearchProgressBarProps {
    duration: number; // in seconds
    onComplete: () => void;
    onCancel?: () => void;
}

/**
 * SearchProgressBar component matching ui.md contract
 * Shows 5-second timer during container search
 */
export const SearchProgressBar: React.FC<SearchProgressBarProps> = ({
    duration,
    onComplete,
    onCancel
}) => {
    const [progress, setProgress] = useState(0);
    const [isActive, setIsActive] = useState(true);
    
    useEffect(() => {
        if (!isActive) return;
        
        const startTime = Date.now();
        const endTime = startTime + (duration * 1000);
        
        const updateProgress = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const total = duration * 1000;
            const newProgress = Math.min(elapsed / total, 1);
            
            setProgress(newProgress);
            
            if (now >= endTime) {
                setIsActive(false);
                onComplete();
            } else {
                requestAnimationFrame(updateProgress);
            }
        };
        
        const animationId = requestAnimationFrame(updateProgress);
        return () => cancelAnimationFrame(animationId);
    }, [duration, onComplete, isActive]);
    
    const handleCancel = () => {
        setIsActive(false);
        if (onCancel) onCancel();
    };
    
    // Format time remaining
    const timeRemaining = Math.ceil(duration * (1 - progress));
    
    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '300px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '8px',
            padding: '15px',
            zIndex: 10000,
            color: 'white',
            textAlign: 'center',
            border: '1px solid #4a4a6d'
        }}>
            <div style={{
                fontSize: '16px',
                marginBottom: '10px',
                color: '#e0e0ff'
            }}>
                🔍 Searching Container...
            </div>
            
            {/* Progress bar */}
            <div style={{
                width: '100%',
                height: '20px',
                backgroundColor: '#333',
                borderRadius: '10px',
                overflow: 'hidden',
                marginBottom: '10px'
            }}>
                <div style={{
                    width: `${progress * 100}%`,
                    height: '100%',
                    backgroundColor: '#2196F3',
                    transition: 'width 0.1s linear'
                }} />
            </div>
            
            {/* Time and cancel */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '14px'
            }}>
                <span>
                    Time remaining: {timeRemaining}s
                </span>
                {onCancel && (
                    <button
                        onClick={handleCancel}
                        style={{
                            padding: '4px 12px',
                            backgroundColor: 'transparent',
                            color: '#ff6b6b',
                            border: '1px solid #ff6b6b',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
};

// ============================================
// EVIDENCE PANEL COMPONENT (Updated)
// ============================================

interface EvidencePanelProps {
    onPropClick?: (prop: Prop) => void;
}

/**
 * EvidencePanel component showing collected evidence
 * Matching ui.md EvidencePanel contract
 */
export const EvidencePanel: React.FC<EvidencePanelProps> = ({ onPropClick }) => {
    const { evidenceProps, totalValue, removeProp } = useEvidenceStore();
    
    // Animation state for new props
    const [newPropIds, setNewPropIds] = useState<Set<string>>(new Set());
    
    // Highlight new props
    useEffect(() => {
        const latestProp = evidenceProps[evidenceProps.length - 1];
        if (latestProp && !newPropIds.has(latestProp.id)) {
            setNewPropIds(prev => new Set([...prev, latestProp.id]));
            
            // Remove highlight after animation
            setTimeout(() => {
                setNewPropIds(prev => {
                    const next = new Set(prev);
                    next.delete(latestProp.id);
                    return next;
                });
            }, 1000);
        }
    }, [evidenceProps]);
    
    // Calculate if any props are red herrings (low evidence value)
    const isRedHerring = (prop: Prop): boolean => {
        return prop.type === 'herring' || prop.evidenceValue < 40;
    };
    
    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '300px',
            maxHeight: '400px',
            backgroundColor: 'rgba(26, 26, 46, 0.9)',
            border: '2px solid #4a4a6d',
            borderRadius: '12px',
            padding: '15px',
            zIndex: 1000,
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                borderBottom: '1px solid #4a4a6d',
                paddingBottom: '10px'
            }}>
                <h3 style={{ 
                    margin: 0, 
                    color: '#e0e0ff',
                    fontSize: '18px'
                }}>
                    Evidence Collected
                </h3>
                <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: totalValue > 70 ? '#4CAF50' : totalValue > 40 ? '#FFC107' : '#F44336'
                }}>
                    {totalValue}
                </div>
            </div>
            
            {/* Evidence List */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: '5px'
            }}>
                {evidenceProps.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        color: '#888',
                        padding: '20px',
                        fontStyle: 'italic'
                    }}>
                        No evidence collected yet
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        {evidenceProps.map((prop, index) => {
                            const isNew = newPropIds.has(prop.id);
                            const isHerring = isRedHerring(prop);
                            
                            return (
                                <div
                                    key={prop.id}
                                    onClick={() => onPropClick?.(prop)}
                                    style={{
                                        padding: '10px',
                                        backgroundColor: isHerring 
                                            ? 'rgba(255, 193, 7, 0.1)' 
                                            : 'rgba(255, 255, 255, 0.05)',
                                        border: `2px solid ${isHerring ? '#FFC107' : isNew ? '#4CAF50' : '#4a4a6d'}`,
                                        borderRadius: '6px',
                                        cursor: onPropClick ? 'pointer' : 'default',
                                        transition: 'all 0.3s ease',
                                        transform: isNew ? 'translateX(0)' : 'translateX(0)',
                                        animation: isNew ? 'slideInRight 0.5s ease' : 'none',
                                        position: 'relative',
                                        opacity: isNew ? 1 : 0.9
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{
                                                fontWeight: 'bold',
                                                color: isHerring ? '#FFC107' : '#e0e0ff',
                                                fontSize: '14px'
                                            }}>
                                                {prop.appearance}
                                            </div>
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#aaa',
                                                marginTop: '2px'
                                            }}>
                                                {prop.type}
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            color: prop.evidenceValue > 70 ? '#4CAF50' : 
                                                   prop.evidenceValue > 40 ? '#FFC107' : '#F44336'
                                        }}>
                                            {prop.evidenceValue}
                                        </div>
                                    </div>
                                    
                                    {/* Remove button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeProp(prop.id);
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: '5px',
                                            right: '5px',
                                            background: 'none',
                                            border: 'none',
                                            color: '#ff6b6b',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            padding: '2px 6px',
                                            borderRadius: '4px'
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            {/* Footer */}
            <div style={{
                fontSize: '12px',
                color: '#888',
                marginTop: '10px',
                textAlign: 'center',
                borderTop: '1px solid #4a4a6d',
                paddingTop: '10px'
            }}>
                {evidenceProps.length} items • Click to inspect
            </div>
        </div>
    );
};

// CSS for animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(styleSheet);