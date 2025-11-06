// Global using directives for CarMaintenance application
// This file enables implicit using statements across all C# files

// .NET Core & ASP.NET Core
global using Microsoft.AspNetCore;
global using Microsoft.AspNetCore.Builder;
global using Microsoft.AspNetCore.Hosting;
global using Microsoft.AspNetCore.Http;
global using Microsoft.AspNetCore.Mvc;
global using Microsoft.AspNetCore.SignalR;
global using Microsoft.AspNetCore.RateLimiting;
global using Microsoft.AspNetCore.OutputCaching;

// .NET Runtime & Base Libraries
global using System;
global using System.Collections.Generic;
global using System.Collections.ObjectModel;
global using System.ComponentModel;
global using System.ComponentModel.DataAnnotations;
global using System.ComponentModel.DataAnnotations.Schema;
global using System.Diagnostics;
global using System.Linq;
global using System.Linq.Expressions;
global using System.Net;
global using System.Reflection;
global using System.Text;
global using System.Text.Json;
global using System.Text.Json.Serialization;
global using System.Threading;
global using System.Threading.Tasks;
global using System.Xml.Linq;

// Entity Framework Core
global using Microsoft.EntityFrameworkCore;
global using Microsoft.EntityFrameworkCore.ChangeTracking;
global using Microsoft.EntityFrameworkCore.Design;
global using Microsoft.EntityFrameworkCore.Metadata;
global using Microsoft.EntityFrameworkCore.Metadata.Builders;
global using Microsoft.EntityFrameworkCore.Query;
global using Microsoft.EntityFrameworkCore.Storage;

// Identity
global using Microsoft.AspNetCore.Identity;
global using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

// Dependency Injection
global using Microsoft.Extensions.DependencyInjection;
global using Microsoft.Extensions.DependencyInjection.Extensions;
global using Microsoft.Extensions.Options;
global using Microsoft.Extensions.Configuration;
global using Microsoft.Extensions.Logging;
global using Microsoft.Extensions.Hosting;
global using Microsoft.Extensions.Diagnostics.HealthChecks;

// HTTP Client
global using System.Net.Http;
global using System.Net.Http.Headers;
global using System.Net.Http.Json;

// Logging
global using Microsoft.Extensions.Logging.Abstractions;
global using Serilog;
global using Serilog.Events;

// Validation
global using FluentValidation;
global using FluentValidation.Results;

// AutoMapper
global using AutoMapper;
global using AutoMapper.QueryableExtensions;

// MediatR
global using MediatR;
global using MediatR.Pipeline;

// Value Objects
global using CarMaintenance.Domain.ValueObjects;

// Domain Events
global using CarMaintenance.Domain.Events;

// Shared Models
global using CarMaintenance.Shared.Models;

// Application
global using CarMaintenance.Application;
global using CarMaintenance.Application.Commands;
global using CarMaintenance.Application.Commands.Base;
global using CarMaintenance.Application.DTOs;
global using CarMaintenance.Application.Mappings;
global using CarMaintenance.Application.Services;
global using CarMaintenance.Application.Validators;
global using CarMaintenance.Application.Behaviors;

// Domain
global using CarMaintenance.Domain;
global using CarMaintenance.Domain.Entities;
global using CarMaintenance.Domain.Interfaces;

// Infrastructure
global using CarMaintenance.Infrastructure;
global using CarMaintenance.Infrastructure.Configuration;
global using CarMaintenance.Infrastructure.Data;
global using CarMaintenance.Infrastructure.Repositories;
global using CarMaintenance.Infrastructure.Services;
global using CarMaintenance.Infrastructure.UnitOfWork;

// API
global using CarMaintenance.Api;
global using CarMaintenance.Api.Data;
global using CarMaintenance.Api.DTOs;
global using CarMaintenance.Api.Hubs;
global using CarMaintenance.Api.Interfaces;
global using CarMaintenance.Api.Middleware;
global using CarMaintenance.Api.Models;
global using CarMaintenance.Api.Services;

// Swagger
global using Swashbuckle.AspNetCore.Swagger;
global using Swashbuckle.AspNetCore.SwaggerGen;
global using Swashbuckle.AspNetCore.Annotations;

// CORS & Security
global using Microsoft.AspNetCore.Cors;
global using Microsoft.AspNetCore.Http.Json;
global using Microsoft.AspNetCore.Authentication.JwtBearer;
global using Microsoft.IdentityModel.Tokens;