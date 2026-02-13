workspace "Shared Calendar" "C4 model for Shared Calendar" {

  !identifiers hierarchical
  !docs docs
  !adrs docs/adr

  model {
    user = person "User" "Uses the shared calendar"

    system = softwareSystem "Shared Calendar" "A lightweight shared calendar with spaces, proposals and realtime updates" {
      web = container "Web App" "UI for calendar/spaces/proposals" "Next.js (React)"
      api = container "API" "Route Handlers providing APIs + SSE stream" "Next.js Route Handlers"
      db = container "Database" "Stores users/spaces/events/proposals/notifications" "MongoDB"
    }

    user -> web "Uses"
    web -> api "Calls HTTP APIs"
    api -> db "Reads/Writes"
    web -> api "Subscribes SSE stream"
  }

  views {
    systemContext system "SystemContext" {
      include *
      autolayout lr
    }

    container system "Containers" {
      include *
      autolayout lr
    }

    styles {
      element "Person" { shape person }
      element "Database" { shape cylinder }
    }
  }
}
