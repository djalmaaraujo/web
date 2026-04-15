# -*- encoding: utf-8 -*-
# stub: tailwind_merge 1.3.2 ruby lib

Gem::Specification.new do |s|
  s.name = "tailwind_merge".freeze
  s.version = "1.3.2".freeze

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.metadata = { "bug_tracker_uri" => "https://github.com/gjtorikian/tailwind_merge/issues", "changelog_uri" => "https://github.com/gjtorikian/tailwind_merge/blob/v1.3.2/CHANGELOG.md", "documentation_uri" => "https://rubydoc.info/gems/tailwind_merge/1.3.2", "funding_uri" => "https://github.com/sponsors/gjtorikian", "homepage_uri" => "https://github.com/gjtorikian/tailwind_merge/tree/v1.3.2", "rubygems_mfa_required" => "true", "source_code_uri" => "https://github.com/gjtorikian/tailwind_merge/tree/v1.3.2" } if s.respond_to? :metadata=
  s.require_paths = ["lib".freeze]
  s.authors = ["Garen J. Torikian".freeze]
  s.bindir = "exe".freeze
  s.date = "1980-01-02"
  s.email = ["gjtorikian@gmail.com".freeze]
  s.homepage = "https://github.com/gjtorikian/tailwind_merge/tree/v1.3.2".freeze
  s.licenses = ["MIT".freeze]
  s.rubygems_version = "4.0.3".freeze
  s.summary = "Utility function to efficiently merge Tailwind CSS classes without style conflicts.".freeze

  s.installed_by_version = "3.6.9".freeze

  s.specification_version = 4

  s.add_runtime_dependency(%q<sin_lru_redux>.freeze, ["~> 2.5".freeze])
  s.add_development_dependency(%q<minitest>.freeze, ["~> 5.6".freeze])
  s.add_development_dependency(%q<minitest-focus>.freeze, ["~> 1.1".freeze])
end
