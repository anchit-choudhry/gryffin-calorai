import type { FC, ReactNode } from "react";

interface Props {
  label: string;
  children: ReactNode;
}

const EditorialFrame: FC<Props> = ({ label, children }) => (
  <div className="border border-rule">
    <div className="px-5 pt-3 pb-2 border-b border-rule">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-soft">
        {label}
      </span>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export default EditorialFrame;
