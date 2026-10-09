import { useId, type ReactNode } from "react";
import { Button } from "./ui";
import type { PageResult, ReferenceItem } from "../types/job";

export function JobField({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: (props: {
    id: string;
    name: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
  }) => ReactNode;
}) {
  const id = useId();
  return (
    <div className={`field ${error ? "field-error" : ""}`}>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {children({
        id,
        name,
        "aria-invalid": !!error,
        "aria-describedby": error || hint ? `${id}-help` : undefined,
      })}
      {(error || hint) && (
        <p
          id={`${id}-help`}
          className={error ? "field-error-text" : "field-hint"}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
export function ReferenceChoices({
  label,
  items,
  selected,
  onChange,
  disabled = false,
}: {
  label: string;
  items: ReferenceItem[];
  selected: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="reference-choices" disabled={disabled}>
      <legend>{label}</legend>
      <div className="reference-options">
        {items.map((item) => (
          <label className="checkbox-label" key={item.id}>
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...selected, item.id]
                    : selected.filter((id) => id !== item.id),
                )
              }
            />
            {item.name}
          </label>
        ))}
        {!items.length && <p className="muted">No options available.</p>}
      </div>
    </fieldset>
  );
}
export function JobError({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="job-error" role="alert">
      <p>{message}</p>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          Retry
        </Button>
      )}
    </div>
  );
}
export function JobPagination({
  page,
  onPage,
}: {
  page: PageResult<unknown>;
  onPage: (n: number) => void;
}) {
  if (page.totalPages === 0 && page.pageNumber === 1) return null;
  const outOfRange = page.pageNumber > page.totalPages;
  return (
    <nav className="pagination" aria-label="Result pages">
      <Button
        variant="secondary"
        disabled={!page.hasPrevious}
        onClick={() => onPage(page.pageNumber - 1)}
      >
        Previous
      </Button>
      <span aria-live="polite">
        Page {page.pageNumber}
        {page.totalPages > 0 ? ` of ${page.totalPages}` : ""}
      </span>
      {outOfRange ? (
        <Button variant="secondary" onClick={() => onPage(1)}>
          First page
        </Button>
      ) : (
        <Button
          variant="secondary"
          disabled={!page.hasNext}
          onClick={() => onPage(page.pageNumber + 1)}
        >
          Next
        </Button>
      )}
    </nav>
  );
}
