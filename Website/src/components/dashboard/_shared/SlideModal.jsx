import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

export default function SlideModal({ isOpen, onClose, title, children }) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="bg-[#0C1319] border-t border-white/10 rounded-t-[32px] p-0 outline-none max-h-[92vh] overflow-hidden"
      >
        <SheetHeader className="sr-only">
           <SheetTitle>{title || 'Modal'}</SheetTitle>
           <SheetDescription>Form modal for {title}</SheetDescription>
        </SheetHeader>

        {/* Handle Bar */}
        <div className="w-10 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2" />
        
        {/* Visible Title */}
        {title && (
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-display text-lg font-bold text-[#F1F5F9]">{title}</h2>
          </div>
        )}
        
        {/* Scrollable Content */}
        <div className="px-6 py-6 pb-12 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
