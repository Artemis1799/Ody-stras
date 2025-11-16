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
    public string Type { get; set; }
    
    public string Description { get; set; }
    
    [MaxLength(50)]
    public string Unite { get; set; }
    
    public float? Stock_total { get; set; }
    
    public float? Stock_restant { get; set; }
    
    [JsonIgnore]
    public ICollection<Point>? Points { get; set; }
}