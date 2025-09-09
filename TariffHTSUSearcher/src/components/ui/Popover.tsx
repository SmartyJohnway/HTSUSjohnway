import React, { useState, useRef, useEffect, useId } from 'react';

interface PopoverProps {
  trigger: React.ReactElement;
  children: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

const Popover: React.FC<PopoverProps> = ({ trigger, children, isOpen: controlledIsOpen, onOpenChange }) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;

  const handleOpenChange = (open: boolean) => {
    if (isControlled) {
      onOpenChange?.(open);
    } else {
      setUncontrolledIsOpen(open);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleOpenChange(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
        contentRef.current && !contentRef.current.contains(event.target as Node)
      ) {
        handleOpenChange(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleOpenChange]);

  const triggerElement = React.cloneElement(trigger, {
    ref: triggerRef,
    onClick: handleToggle,
    'aria-expanded': isOpen,
    'aria-controls': `popover-content-${id}`,
  });

  return (
    <>
      {triggerElement}
      {isOpen && (
        <div
          id={`popover-content-${id}`}
          ref={contentRef}
          role="dialog"
          className="absolute z-20 mt-2 w-72 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg"
          style={{
            // Basic positioning, can be improved with a library like Popper.js
            top: triggerRef.current ? triggerRef.current.offsetTop + triggerRef.current.offsetHeight : 0,
            left: triggerRef.current ? triggerRef.current.offsetLeft : 0,
           }}
        >
          <div className="p-4">
            {children}
          </div>
        </div>
      )}
    </>
  );
};

export default Popover;
