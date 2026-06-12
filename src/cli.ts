#!/usr/bin/env bun

import { Command } from "commander";
import pc from "picocolors";
import { startServer } from "./server";

const program = new Command();

program
  .name("mockify")
  .description("Minimalist local mock server for fast frontend prototyping")
  .version("1.0.0");

program
  .command("start")
  .description("Start the mock server")
  .option("-p, --port <number>", "Port to bind the server", "4000")
  .action((options) => {
    const port = parseInt(options.port, 10);
    console.log(pc.green(`🚀 Mockify is preparing...`));
    startServer(port);
  });

program.parse(process.argv);