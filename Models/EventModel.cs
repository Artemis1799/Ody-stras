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
    public string Name { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
    
    public DateTime? StartDate { get; set; }
    
    [Required]
    public EventStatus Status { get; set; }
    
    public ICollection<EventTeam>? EventTeams { get; set; }
}