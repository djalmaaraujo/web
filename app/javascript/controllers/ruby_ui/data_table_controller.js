import { Controller } from "@hotwired/stimulus";
import * as Turbo from "@hotwired/turbo";
import {
  createTable,
  getCoreRowModel,
  getSortedRowModel,
} from "@tanstack/table-core";

export default class extends Controller {
  static targets = [
    "thead",
    "tbody",
    "prevButton",
    "nextButton",
    "pageIndicator",
    "search",
    "perPage",
    "bulkActions",
    "columnToggleTrigger",
    "columnMenu",
    "tplSortAsc",
    "tplSortDesc",
    "tplSortNone",
    "tplCheckbox",
    "tplChevron",
    "tplExpandedRow",
  ];
  static values = {
    src: String,
    data: { type: Array, default: [] },
    columns: { type: Array, default: [] },
    rowCount: { type: Number, default: 0 },
    pagination: { type: Object, default: { pageIndex: 0, pageSize: 10 } },
    sorting: { type: Array, default: [] },
    search: { type: String, default: "" },
    selectable: { type: Boolean, default: false },
    syncUrl: { type: Boolean, default: true },
    columnVisibility: { type: Object, default: {} },
    options: { type: Object, default: {} },
  };

  connect() {
    this.searchTimeout = null;
    this.rowSelection = {};

    this.hasServer = this.hasSrcValue && !!this.srcValue;

    const columnDefs = this.columnsValue.map((c) => ({
      id: c.key,
      accessorKey: c.key,
      header: c.header,
    }));

    this.table = createTable({
      data: this.dataValue,
      columns: columnDefs,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: this.hasServer ? undefined : getSortedRowModel(),
      renderFallbackValue: null,
      manualPagination: this.hasServer,
      manualSorting: this.hasServer,
      manualFiltering: this.hasServer,
      rowCount: this.rowCountValue,
      enableRowSelection: this.selectableValue,
      enableMultiRowSelection: true,
      getRowId: (row) => String(row.id ?? row[Object.keys(row)[0]]),
      // Spread any user-provided TanStack options (enableExpanding, etc.)
      ...this.optionsValue,
      state: {},
      onStateChange: () => {},
    });

    this.expandable = this.hasTplExpandedRowTarget || this.optionsValue.enableExpanding === true;

    this.tableState = {
      ...this.table.initialState,
      pagination: this.paginationValue,
      sorting: this.sortingValue,
      globalFilter: this.searchValue,
      rowSelection: this.rowSelection,
      columnVisibility: this.columnVisibilityValue,
      expanded: {},
    };

    this.table.setOptions((prev) => ({
      ...prev,
      state: this.tableState,
      onPaginationChange: (updater) => {
        const next =
          typeof updater === "function"
            ? updater(this.tableState.pagination)
            : updater;
        this.tableState = {
          ...this.tableState,
          pagination: next,
        };
        this.table.setOptions((p) => ({ ...p, state: this.tableState }));
        this.#fetchAndRender();
      },
      onSortingChange: (updater) => {
        const next =
          typeof updater === "function"
            ? updater(this.tableState.sorting)
            : updater;
        this.tableState = {
          ...this.tableState,
          sorting: next,
          pagination: { ...this.tableState.pagination, pageIndex: 0 },
        };
        this.table.setOptions((p) => ({ ...p, state: this.tableState }));
        if (this.hasServer) {
          this.#fetchAndRender();
        } else {
          this.render();
          this.#syncURL();
        }
      },
      onRowSelectionChange: (updater) => {
        const next =
          typeof updater === "function"
            ? updater(this.tableState.rowSelection)
            : updater;
        this.rowSelection = next;
        this.tableState = { ...this.tableState, rowSelection: next };
        this.table.setOptions((p) => ({ ...p, state: this.tableState }));
        this.render();
      },
      onColumnVisibilityChange: (updater) => {
        const next =
          typeof updater === "function"
            ? updater(this.tableState.columnVisibility)
            : updater;
        this.tableState = { ...this.tableState, columnVisibility: next };
        this.table.setOptions((p) => ({ ...p, state: this.tableState }));
        this.render();
      },
      onExpandedChange: (updater) => {
        const next =
          typeof updater === "function"
            ? updater(this.tableState.expanded)
            : updater;
        this.tableState = { ...this.tableState, expanded: next };
        this.table.setOptions((p) => ({ ...p, state: this.tableState }));
        this.render();
      },
      onStateChange: (updater) => {
        const next =
          typeof updater === "function" ? updater(this.tableState) : updater;
        this.tableState = next;
        this.table.setOptions((p) => ({ ...p, state: this.tableState }));
        this.render();
      },
    }));

    if (this.hasSearchTarget && this.searchValue) {
      this.searchTarget.value = this.searchValue;
    }

    this.render();
  }

  disconnect() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  }

  previousPage() {
    this.table.previousPage();
  }
  nextPage() {
    this.table.nextPage();
  }

  search() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      const query = this.searchTarget.value;
      this.tableState = {
        ...this.tableState,
        globalFilter: query,
        pagination: { ...this.tableState.pagination, pageIndex: 0 },
      };
      this.table.setOptions((p) => ({ ...p, state: this.tableState }));
      this.#fetchAndRender();
    }, 300);
  }

  changePerPage() {
    const pageSize = parseInt(this.perPageTarget.value);
    this.tableState = {
      ...this.tableState,
      pagination: { pageIndex: 0, pageSize },
    };
    this.table.setOptions((p) => ({ ...p, state: this.tableState }));
    this.#fetchAndRender();
  }

  render() {
    this.#renderHeaders();
    this.#syncPaginationUI();
    this.#syncBulkActionsUI();
    this.#renderColumnMenu();
  }

  toggleColumnMenu(event) {
    event.stopPropagation();
    if (!this.hasColumnMenuTarget) return;
    const menu = this.columnMenuTarget;
    menu.classList.toggle("hidden");

    if (!menu.classList.contains("hidden")) {
      this._closeColumnMenuOnOutsideClick = (e) => {
        if (!this.element.contains(e.target)) {
          menu.classList.add("hidden");
          document.removeEventListener("click", this._closeColumnMenuOnOutsideClick);
        }
      };
      document.addEventListener("click", this._closeColumnMenuOnOutsideClick);
    }
  }

  toggleColumnVisibility(event) {
    const col = this.table.getColumn(event.target.dataset.colId);
    if (col) col.toggleVisibility(event.target.checked);
  }

  toggleRowExpansion(event) {
    const rowId = event.currentTarget.dataset.rowId;
    const row = this.table.getRowModel().rows.find((r) => r.id === rowId);
    if (row) row.toggleExpanded();
  }

  async #fetchAndRender() {
    if (!this.hasSrcValue || !this.srcValue) return;

    const res = await fetch(this.#buildURL(), {
      headers: { Accept: "text/vnd.turbo-stream.html" },
    });
    const html = await res.text();

    // Turbo parses the <turbo-stream> and applies action="update" to #datatable_tbody
    Turbo.renderStreamMessage(html);

    // After DOM swap, re-sync client-side state with the new elements
    this.#reconcileAfterSwap();
    this.#renderHeaders(); // headers still driven by TanStack state (sort icons)
    this.#syncPaginationUI();
    this.#syncBulkActionsUI();
    this.#syncURL();
  }

  // After Rails renders fresh tbody HTML, reconcile client-side state:
  //  - checkbox .checked reflects tableState.rowSelection
  //  - row rows with selection get the muted background
  #reconcileAfterSwap() {
    if (!this.hasTbodyTarget) return;

    const selection = this.tableState.rowSelection || {};

    this.tbodyTarget.querySelectorAll("tr[data-row-id]").forEach((tr) => {
      const id = tr.dataset.rowId;
      const isSelected = selection[id] === true;
      tr.classList.toggle("bg-muted/50", isSelected);
    });

    this.tbodyTarget
      .querySelectorAll("input[type=checkbox][data-row-id]")
      .forEach((cb) => {
        const id = cb.dataset.rowId;
        cb.checked = selection[id] === true;
      });
  }

  #buildURL() {
    const url = new URL(this.srcValue, window.location.origin);
    const { pageIndex, pageSize } = this.tableState.pagination;
    url.searchParams.set("page", pageIndex + 1);
    url.searchParams.set("per_page", pageSize);
    if (this.tableState.sorting.length > 0) {
      const { id, desc } = this.tableState.sorting[0];
      url.searchParams.set("sort", id);
      url.searchParams.set("direction", desc ? "desc" : "asc");
    }
    if (this.tableState.globalFilter) {
      url.searchParams.set("search", this.tableState.globalFilter);
    }
    return url.toString();
  }

  #syncURL() {
    if (!this.hasSrcValue || !this.srcValue) return;
    if (!this.syncUrlValue) return;
    history.replaceState(null, "", this.#buildURL());
  }

  #syncPaginationUI() {
    if (this.hasPageIndicatorTarget) {
      const { pageIndex } = this.tableState.pagination;
      this.pageIndicatorTarget.textContent = `Page ${pageIndex + 1} of ${this.table.getPageCount()}`;
    }
    if (this.hasPrevButtonTarget) {
      const can = this.table.getCanPreviousPage();
      this.prevButtonTarget.disabled = !can;
      this.prevButtonTarget.classList.toggle("opacity-50", !can);
      this.prevButtonTarget.classList.toggle("pointer-events-none", !can);
    }
    if (this.hasNextButtonTarget) {
      const can = this.table.getCanNextPage();
      this.nextButtonTarget.disabled = !can;
      this.nextButtonTarget.classList.toggle("opacity-50", !can);
      this.nextButtonTarget.classList.toggle("pointer-events-none", !can);
    }
  }

  #renderColumnMenu() {
    if (!this.hasColumnMenuTarget) return;

    const columns = this.table
      .getAllLeafColumns()
      .filter((col) => col.getCanHide());

    const fragment = document.createDocumentFragment();

    columns.forEach((col) => {
      const label = document.createElement("label");
      label.className = "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent";

      const cb = this.#cloneTemplate("tplCheckbox")?.firstElementChild
        || Object.assign(document.createElement("input"), { type: "checkbox" });
      cb.checked = col.getIsVisible();
      cb.dataset.colId = col.id;
      cb.dataset.action = "change->ruby-ui--data-table#toggleColumnVisibility";
      label.appendChild(cb);

      const span = document.createElement("span");
      const def = col.columnDef.header;
      span.textContent = typeof def === "function" ? col.id : (def ?? col.id);
      label.appendChild(span);

      fragment.appendChild(label);
    });

    this.columnMenuTarget.replaceChildren(fragment);
  }

  #syncBulkActionsUI() {
    if (!this.hasBulkActionsTarget) return;

    const selected = this.table.getSelectedRowModel().rows;
    const count = selected.length;
    const ids = selected.map((r) => r.id);

    if (count > 0) {
      this.bulkActionsTarget.classList.remove("hidden");
      this.bulkActionsTarget.classList.add("flex");
      this.bulkActionsTarget.dataset.selectedIds = JSON.stringify(ids);
      this.bulkActionsTarget.dataset.selectedCount = count;

      const countEl = this.bulkActionsTarget.querySelector(
        "[data-selection-count]",
      );
      if (countEl)
        countEl.textContent = `${count} row${count === 1 ? "" : "s"} selected`;
    } else {
      this.bulkActionsTarget.classList.add("hidden");
      this.bulkActionsTarget.classList.remove("flex");
      this.bulkActionsTarget.dataset.selectedIds = "[]";
      this.bulkActionsTarget.dataset.selectedCount = 0;
    }

    // Dispatch custom event so consumers can react
    this.dispatch("selection-change", { detail: { count, ids } });
  }

  // Clone a <template> target into a live DOM node
  #cloneTemplate(targetName) {
    const tpl = this[`${targetName}Target`];
    return tpl ? tpl.content.cloneNode(true) : null;
  }

  #sortIcon(sorted) {
    const name = sorted === "asc" ? "tplSortAsc" : sorted === "desc" ? "tplSortDesc" : "tplSortNone";
    return this[`has${name.charAt(0).toUpperCase() + name.slice(1)}Target`]
      ? this.#cloneTemplate(name)
      : null;
  }

  #renderHeaders() {
    if (!this.hasTheadTarget) return;

    const fragment = document.createDocumentFragment();

    this.table.getHeaderGroups().forEach((group) => {
      const tr = document.createElement("tr");
      tr.className = "border-b transition-colors";

      if (this.expandable) {
        const th = document.createElement("th");
        th.className = "h-10 w-10 px-2 align-middle";
        tr.appendChild(th);
      }

      if (this.selectableValue) {
        const th = document.createElement("th");
        th.className = "h-10 w-10 px-2 align-middle";

        const cb = this.#cloneTemplate("tplCheckbox")?.firstElementChild
          || Object.assign(document.createElement("input"), { type: "checkbox" });
        cb.checked = this.table.getIsAllPageRowsSelected();
        cb.indeterminate = this.table.getIsSomePageRowsSelected() && !cb.checked;
        cb.dataset.action = "change->ruby-ui--data-table#toggleAllRows";
        th.appendChild(cb);
        tr.appendChild(th);
      }

      group.headers.forEach((header) => {
        const def = header.column.columnDef.header;
        const label = typeof def === "function" ? def(header.getContext()) : (def ?? "");
        const th = document.createElement("th");
        th.className = "h-10 px-2 text-left align-middle font-medium text-muted-foreground";

        if (header.column.getCanSort()) {
          const btn = document.createElement("button");
          btn.className = "flex items-center gap-1 hover:text-foreground transition-colors";
          btn.dataset.sortCol = header.column.id;
          btn.appendChild(document.createTextNode(label));

          const icon = this.#sortIcon(header.column.getIsSorted());
          if (icon) btn.appendChild(icon);

          btn.addEventListener("click", () => header.column.toggleSorting());
          th.appendChild(btn);
        } else {
          th.textContent = label;
        }

        tr.appendChild(th);
      });

      fragment.appendChild(tr);
    });

    this.theadTarget.replaceChildren(fragment);
  }

  toggleAllRows(event) {
    const checked = event.target.checked;
    const ids = Array.from(
      this.tbodyTarget.querySelectorAll("tr[data-row-id]")
    ).map((tr) => tr.dataset.rowId);

    this.table.setRowSelection((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        if (checked) next[id] = true;
        else delete next[id];
      });
      return next;
    });

    this.#reconcileAfterSwap();
  }

  toggleRow(event) {
    const rowId = event.target.dataset.rowId;
    const checked = event.target.checked;
    this.table.setRowSelection((prev) => ({ ...prev, [rowId]: checked }));
    // Update tr background immediately for responsiveness
    const tr = event.target.closest("tr[data-row-id]");
    if (tr) tr.classList.toggle("bg-muted/50", checked);
  }

}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
