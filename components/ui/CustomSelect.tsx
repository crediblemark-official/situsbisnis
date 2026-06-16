"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export function CustomSelect({ 
    options, 
    value, 
    onChange, 
    placeholder = "Select...",
    className = "",
    variant = "default",
    id,
    disabled = false
}: { 
    options: { label: string | React.ReactNode; value: string }[]; 
    value: string; 
    onChange: (_val: string) => void;
    placeholder?: string;
    className?: string;
    variant?: "default" | "primary";
    id?: string;
    disabled?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectButtonId = id || "custom-select-btn";

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    const [prevValue, setPrevValue] = useState(value);
    const [prevOptions, setPrevOptions] = useState(options);

    if (isOpen !== prevIsOpen || value !== prevValue || options !== prevOptions) {
        setPrevIsOpen(isOpen);
        setPrevValue(value);
        setPrevOptions(options);
        if (isOpen) {
            const selectedIdx = options.findIndex(opt => opt.value === value);
            setHighlightedIndex(selectedIdx !== -1 ? selectedIdx : 0);
        } else {
            setHighlightedIndex(-1);
        }
    }

    const selectedOption = options.find(opt => opt.value === value);

    const toggleOpen = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
    };

    const handleSelect = (val: string) => {
        if (disabled) return;
        onChange(val);
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else if (options.length > 0) {
                    setHighlightedIndex(prev => (prev + 1) % options.length);
                }
                break;
            case "ArrowUp":
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else if (options.length > 0) {
                    setHighlightedIndex(prev => (prev - 1 + options.length) % options.length);
                }
                break;
            case "Enter":
            case " ":
                e.preventDefault();
                if (isOpen) {
                    if (highlightedIndex >= 0 && highlightedIndex < options.length) {
                        handleSelect(options[highlightedIndex].value);
                    }
                } else {
                    setIsOpen(true);
                }
                break;
            case "Escape":
                e.preventDefault();
                setIsOpen(false);
                break;
            case "Tab":
                setIsOpen(false);
                break;
        }
    };

    const colorClass = variant === "primary" ? "text-primary" : "text-foreground";

    return (
        <div ref={containerRef} className={`relative min-w-[140px] ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <button
                id={selectButtonId}
                type="button"
                onClick={toggleOpen}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls={isOpen ? `${selectButtonId}-listbox` : undefined}
                aria-activedescendant={isOpen && highlightedIndex >= 0 ? `${selectButtonId}-opt-${highlightedIndex}` : undefined}
                role="combobox"
                className={`
                    w-full flex items-center justify-between px-3 py-1.5 
                    bg-muted/10 border border-border rounded-lg text-xs 
                    outline-none transition-all hover:bg-muted/20 
                    focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50
                    ${isOpen ? 'border-muted-foreground' : ''} 
                    ${colorClass} 
                    ${disabled ? 'cursor-not-allowed' : ''}
                `}
            >
                <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                <ChevronDown size={14} className={`ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>

            {isOpen && (
                <div
                    id={`${selectButtonId}-listbox`}
                    role="listbox"
                    className="absolute z-[100] mt-1 w-full bg-background border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto custom-scrollbar"
                >
                    {options.length === 0 ? (
                        <div className="px-3 py-2 text-[10px] text-muted-foreground italic">No options available</div>
                    ) : (
                        options.map((opt, index) => {
                            const isSelected = value === opt.value;
                            const isHighlighted = index === highlightedIndex;
                            return (
                                <div
                                    id={`${selectButtonId}-opt-${index}`}
                                    key={opt.value}
                                    role="option"
                                    aria-selected={isSelected}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSelect(opt.value)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    className={`
                                        flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors
                                        ${isSelected 
                                            ? 'bg-primary/10 text-primary font-bold' 
                                            : isHighlighted 
                                                ? 'bg-muted/20 text-foreground' 
                                                : 'text-muted-foreground hover:bg-muted/10 hover:text-foreground'
                                        }
                                    `}
                                >
                                    <span>{opt.label}</span>
                                    {isSelected && <Check size={12} className="text-primary" aria-hidden="true" />}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
