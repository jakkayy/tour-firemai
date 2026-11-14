"""Dedicated PostHog OTLP logger for summary records added by this integration."""

import logging
import os
import sys
from typing import Optional

from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.resources import Resource

_logger_provider: Optional[LoggerProvider] = None


def get_posthog_logger() -> logging.Logger:
    """Return an isolated logger which exports only explicitly added records."""
    global _logger_provider

    logger = logging.getLogger("tour_firemai.posthog")
    key = os.environ.get("NEXT_PUBLIC_POSTHOG_KEY", "").strip()
    host = os.environ.get("NEXT_PUBLIC_POSTHOG_HOST", "").strip()
    if not key or not host:
        environment = os.environ.get("ENV") or os.environ.get("NODE_ENV")
        if environment != "production":
            missing_variable = "NEXT_PUBLIC_POSTHOG_KEY" if not key else "NEXT_PUBLIC_POSTHOG_HOST"
            print(
                f"{missing_variable} variable required by PostHog is missing or un-configured, "
                f"this causes events to be silently missed. This error stops appearing once "
                f"{missing_variable} is configured",
                file=sys.stderr,
            )
        return logger

    _logger_provider = LoggerProvider(
        resource=Resource.create({"service.name": "tour-firemai-scraper"})
    )
    exporter = OTLPLogExporter(
        endpoint=f"{host.rstrip('/')}/i/v1/logs",
        headers={"Authorization": f"Bearer {key}"},
    )
    _logger_provider.add_log_record_processor(BatchLogRecordProcessor(exporter))
    logger.addHandler(LoggingHandler(logger_provider=_logger_provider))
    logger.setLevel(logging.INFO)
    logger.propagate = False
    return logger


def shutdown_posthog_logs() -> None:
    """Flush only after the scheduled scrape has finished."""
    if _logger_provider is not None:
        try:
            _logger_provider.shutdown()
        except Exception:
            pass
