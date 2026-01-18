using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace t5_back.Models;

public class Equipment
{
    [Key]
    public Guid UUID { get; set; }
    
    [MaxLength(100)]
    public string? Type { get; set; }
    
    public float? Length { get; set; }
    
    public string? Description { get; set; }
    
    public StorageType? StorageType { get; set; }
    
    [JsonIgnore]
    public ICollection<Point>? Points { get; set; }
    
    [JsonIgnore]
    public ICollection<SecurityZone>? SecurityZones { get; set; }
}
