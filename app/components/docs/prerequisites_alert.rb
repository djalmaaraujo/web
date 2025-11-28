# frozen_string_literal: true

module Components
  module Docs
    class PrerequisitesAlert < Components::Base
      def view_template
        Alert(variant: :info) do
          AlertTitle { "Important" }
          AlertDescription do
            plain "To take full advantage of RubyUI, the application is expected to be using "
            a(
              href: "https://tailwindcss.com/docs/installation/framework-guides/ruby-on-rails",
              target: "_blank",
              rel: "noopener noreferrer",
              class: "underline font-medium"
            ) { "TailwindCSS 4" }
            plain " and Stimulus."
          end
        end
      end
    end
  end
end
