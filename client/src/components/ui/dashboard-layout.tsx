import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode[];
  defaultSizes?: number[];
  className?: string;
}

export function DashboardLayout({
  children,
  defaultSizes = Array(children.length).fill(100 / children.length),
  className,
}: DashboardLayoutProps) {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className={cn("min-h-[350px] rounded-lg", className)}
    >
      {children.map((child, index) => (
        <div key={`panel-group-${index}`}>
          <ResizablePanel
            defaultSize={defaultSizes[index]}
            className="p-1.5"
          >
            {child}
          </ResizablePanel>
          {index < children.length - 1 && (
            <ResizableHandle withHandle className="bg-border" />
          )}
        </div>
      ))}
    </ResizablePanelGroup>
  );
}

export function DashboardPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("h-full overflow-auto p-3", className)}>
      {children}
    </Card>
  );
}