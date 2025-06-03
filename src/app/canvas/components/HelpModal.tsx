// components/HelpModal.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function HelpModal({
  open,
  onOpenChange,
  view,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  view: "tutorial" | "faq" | "feedback";
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {view === "tutorial"
              ? "Tutorial"
              : view === "faq"
              ? "Frequently Asked Questions"
              : "Send Feedback"}
          </DialogTitle>
        </DialogHeader>

        {view === "tutorial" && (
          <div className="space-y-3 text-sm">
            <h3 className="font-semibold">When a node is selected:</h3>
            <ul className="list-disc pl-5">
              <li><code>✔️</code> Mark as done/undone</li>
              <li><code>➕</code> Add step after</li>
              <li><code>🌿</code> Generate sub-roadmap</li>
              <li><code>🗑️</code> Delete step</li>
            </ul>
            <h3 className="font-semibold">Sidebar</h3>
            <p>Navigate between steps quickly.</p>
            <h3 className="font-semibold">Header</h3>
            <p>Save, expand/collapse all, toggle minimap, and access this menu.</p>
          </div>
        )}

        {view === "faq" && (
          <div className="space-y-3 text-sm">
            <p><strong>Q: How do I mark a step done?</strong><br />A: Click the check icon.</p>
            <p><strong>Q: How do I add a step?</strong><br />A: Select a node, then hit the plus icon.</p>
            <p><strong>Q: What is a sub-roadmap?</strong><br />A: A smaller roadmap based on the main node, splitting it into smaller chunks.</p>
          </div>
        )}

        {view === "feedback" && (
          <div className="space-y-3">
            <Textarea placeholder="Let us know what you think..." rows={5} />
            <Button className="w-full">Submit</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
