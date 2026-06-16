"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { LucideProps, Info } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

interface DynamicIconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

/**
 * DynamicIcon component that lazy-loads Lucide icons.
 * This prevents bundling the entire lucide-react library.
 */
// Global cache to store loaded icon components
const iconCache = new Map<string, React.ComponentType<LucideProps>>();

const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  const iconName = useMemo(() => {
    if (!name) return 'info';
    
    // If it's PascalCase (e.g., HelpCircle), convert to kebab-case (help-circle)
    return name
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase() as keyof typeof dynamicIconImports;
  }, [name]);

  // Priority 1: Get from cache immediately during render
  const cachedComponent = iconCache.get(iconName);
  
  // Priority 2: Use state for async-loaded components, including the name to track which icon was loaded
  const [loadedIcon, setLoadedIcon] = useState<{ name: string; component: React.ComponentType<LucideProps> | null }>({
    name: iconName,
    component: cachedComponent || null
  });

  useEffect(() => {
    // If it's already cached, we don't need to do anything in the effect
    if (cachedComponent) return;

    let isMounted = true;
    const importFn = dynamicIconImports[iconName];
    
    if (importFn) {
      importFn()
        .then((module) => {
          if (!isMounted) return;
          const component = module.default;
          iconCache.set(iconName, component);
          setLoadedIcon({ name: iconName, component });
        })
        .catch(() => {
          if (!isMounted) return;
          iconCache.set(iconName, Info);
          setLoadedIcon({ name: iconName, component: Info });
        });
    }

    return () => {
      isMounted = false;
    };
  }, [iconName, cachedComponent]);

  // Only use the loaded component if it matches the current iconName
  const currentLoadedComponent = loadedIcon.name === iconName ? loadedIcon.component : null;
  
  // Fallback priority: Cache -> Async Loaded -> Info (if name is invalid)
  const Icon = cachedComponent || currentLoadedComponent || (!dynamicIconImports[iconName] ? Info : null);

  if (Icon) {
    return React.createElement(Icon, props);
  }

  // Loading state matching the previous dynamic loading implementation
  return (
    <div 
      style={{ width: props.size || 24, height: props.size || 24 }} 
      className="animate-pulse bg-slate-200 rounded-full" 
    />
  );
};

export default DynamicIcon;
