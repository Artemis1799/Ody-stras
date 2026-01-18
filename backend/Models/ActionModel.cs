using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace t5_back.Models;

public class Action
{
    [Key]
    public Guid UUID { get; set; }
    
    [Required]
    public Guid PlanningId { get; set; }
    
    [Required]
    public Guid SecurityZoneId { get; set; }
    
    [Required]
    public ActionType Type { get; set; }
    
    [Required]
    public DateTime Date { get; set; }
    
    [Required]
    public float Longitude { get; set; }
    
    [Required]
    public float Latitude { get; set; }
    
    [ForeignKey("PlanningId")]
    [JsonIgnore]
    public Planning? Planning { get; set; }
    
    [ForeignKey("SecurityZoneId")]
    [JsonIgnore]
    public SecurityZone? SecurityZone { get; set; }
}
