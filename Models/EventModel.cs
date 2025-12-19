using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace t5_back.Models;

public class Event
{
    [Key]
    public Guid UUID { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    public DateTime StartDate { get; set; }
    
    [Required]
    public DateTime EndDate { get; set; }
    
    [Required]
    public EventStatus Status { get; set; }
    
    [JsonIgnore]
    public ICollection<Team>? Teams { get; set; }
    
    [JsonIgnore]
    public ICollection<Point>? Points { get; set; }
    
    [JsonIgnore]
    public ICollection<Area>? Areas { get; set; }
    
    [JsonIgnore]
    public ICollection<RoutePath>? Paths { get; set; }
    
    [JsonIgnore]
    public ICollection<SecurityZone>? SecurityZones { get; set; }
}
