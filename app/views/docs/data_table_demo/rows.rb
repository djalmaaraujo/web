# frozen_string_literal: true

module Views
  module Docs
    module DataTableDemo
      class Rows < Views::Base
        include Phlex::Rails::Helpers::NumberToCurrency
        include Phlex::Rails::Helpers::MailTo

        STATUS_COLORS = {
          "Active" => "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
          "Inactive" => "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
          "On Leave" => "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        }.freeze

        def initialize(employees:, selectable: true)
          @employees = employees
          @selectable = selectable
        end

        def view_template
          @employees.each do |e|
            tr(
              class: "border-b transition-colors hover:bg-muted/50",
              data: {row_id: e.id}
            ) do
              if @selectable
                td(class: "w-10 px-2 align-middle") do
                  input(
                    type: "checkbox",
                    class: "h-4 w-4 rounded border border-input accent-primary cursor-pointer",
                    data: {row_id: e.id, action: "change->ruby-ui--data-table#toggleRow"}
                  )
                end
              end

              td(class: "p-2 align-middle font-medium") { e.name }
              td(class: "p-2 align-middle text-muted-foreground") do
                if e.email.present?
                  mail_to(e.email, class: "underline underline-offset-2 hover:text-primary")
                end
              end
              td(class: "p-2 align-middle") { e.department }
              td(class: "p-2 align-middle") do
                span(
                  class: "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium #{status_pill_class(e.status)}"
                ) { e.status }
              end
              td(class: "p-2 align-middle font-mono text-right") { number_to_currency(e.salary, precision: 0) }
            end
          end
        end

        private

        def status_pill_class(status)
          STATUS_COLORS.fetch(status, "bg-muted text-muted-foreground")
        end
      end
    end
  end
end
